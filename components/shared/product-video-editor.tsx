"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Film,
  Loader2,
  Minus,
  Move,
  Plus,
  Upload,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BRAND_MONOGRAM_SRC } from "@/lib/constants";

type LogoSource = "brand" | "custom";
type LogoPos = { x: number; y: number };

export type EditedVideoResult = {
  displayFile: File;
  cleanFile: File;
  hasWatermark: boolean;
};

type ProductVideoEditorProps = {
  open: boolean;
  videoSrc: string | null;
  title?: string;
  onOpenChange: (open: boolean) => void;
  onApply: (result: EditedVideoResult) => Promise<void> | void;
};

const ASPECT_OPTIONS: Array<{ id: string; label: string; value: number }> = [
  { id: "1:1", label: "Square", value: 1 },
  { id: "9:16", label: "Story", value: 9 / 16 },
  { id: "16:9", label: "Wide", value: 16 / 9 },
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function isSameOriginSrc(src: string): boolean {
  if (
    src.startsWith("/") ||
    src.startsWith("blob:") ||
    src.startsWith("data:")
  ) {
    return true;
  }
  try {
    return new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (!isSameOriginSrc(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load logo"));
    img.src = src;
  });
}

function pickRecorderMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }
  return "video/webm";
}

function drawCoverFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  outW: number,
  outH: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const scale = Math.max(outW / vw, outH / vh) * zoom;
  const drawW = vw * scale;
  const drawH = vh * scale;
  const maxPanX = Math.max(0, (drawW - outW) / 2);
  const maxPanY = Math.max(0, (drawH - outH) / 2);
  const x = (outW - drawW) / 2 + panX * maxPanX;
  const y = (outH - drawH) / 2 + panY * maxPanY;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(video, x, y, drawW, drawH);
}

async function recordPass(params: {
  video: HTMLVideoElement;
  outW: number;
  outH: number;
  zoom: number;
  panX: number;
  panY: number;
  logo?: HTMLImageElement | null;
  logoPos: LogoPos;
  logoSize: number;
  logoOpacity: number;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = params.outW;
  canvas.height = params.outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const mimeType = pickRecorderMime();
  const stream = canvas.captureStream(30);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2_500_000,
  });

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = () => reject(new Error("Video export failed"));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType.split(";")[0] || "video/webm" }));
    };
  });

  const drawLogo = () => {
    if (!params.logo) return;
    const short = Math.min(params.outW, params.outH);
    const target = Math.max(16, Math.round(short * params.logoSize));
    const ratio = params.logo.width / Math.max(params.logo.height, 1);
    const logoW = target;
    const logoH = Math.round(target / ratio);
    const x = clamp(
      Math.round(params.logoPos.x * params.outW),
      0,
      Math.max(0, params.outW - logoW),
    );
    const y = clamp(
      Math.round(params.logoPos.y * params.outH),
      0,
      Math.max(0, params.outH - logoH),
    );
    ctx.save();
    ctx.globalAlpha = params.logoOpacity;
    ctx.drawImage(params.logo, x, y, logoW, logoH);
    ctx.restore();
  };

  let raf = 0;
  const tick = () => {
    drawCoverFrame(
      ctx,
      params.video,
      params.outW,
      params.outH,
      params.zoom,
      params.panX,
      params.panY,
    );
    drawLogo();
    raf = requestAnimationFrame(tick);
  };

  params.video.pause();
  params.video.currentTime = 0;
  await new Promise<void>((resolve) => {
    const onSeeked = () => {
      params.video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    params.video.addEventListener("seeked", onSeeked);
    if (params.video.readyState >= 2) {
      params.video.removeEventListener("seeked", onSeeked);
      resolve();
    }
  });

  recorder.start(100);
  tick();
  params.video.muted = true;
  await params.video.play();

  await new Promise<void>((resolve) => {
    const onEnded = () => {
      params.video.removeEventListener("ended", onEnded);
      resolve();
    };
    params.video.addEventListener("ended", onEnded);
    // Safety cap ~45s
    window.setTimeout(resolve, Math.min((params.video.duration || 30) * 1000 + 500, 45_000));
  });

  params.video.pause();
  cancelAnimationFrame(raf);
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  return done;
}

export function ProductVideoEditor({
  open,
  videoSrc,
  title = "Edit product video",
  onOpenChange,
  onApply,
}: ProductVideoEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const workVideoRef = useRef<HTMLVideoElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const logoSizeRef = useRef(0.12);
  const draggingRef = useRef(false);

  const [aspectId, setAspectId] = useState("1:1");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [withLogo, setWithLogo] = useState(false);
  const [logoSource, setLogoSource] = useState<LogoSource>("brand");
  const [customLogoSrc, setCustomLogoSrc] = useState<string | null>(null);
  const [logoPos, setLogoPos] = useState<LogoPos>({ x: 0.72, y: 0.72 });
  const [logoOpacity, setLogoOpacity] = useState(0.85);
  const [logoSize, setLogoSize] = useState(0.12);
  const [draggingLogo, setDraggingLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ w: 360, h: 360 });

  const aspect = ASPECT_OPTIONS.find((a) => a.id === aspectId)?.value ?? 1;
  const activeLogoSrc =
    logoSource === "custom" && customLogoSrc
      ? customLogoSrc
      : BRAND_MONOGRAM_SRC;

  logoSizeRef.current = logoSize;
  draggingRef.current = draggingLogo;

  useEffect(() => {
    if (!open) return;
    setAspectId("1:1");
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setWithLogo(false);
    setLogoSource("brand");
    setCustomLogoSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setLogoPos({ x: 0.72, y: 0.72 });
    setLogoOpacity(0.85);
    setLogoSize(0.12);
    setDraggingLogo(false);
    setBusy(false);
    setProgress(null);
    setError(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }, [open, videoSrc]);

  useEffect(() => {
    return () => {
      if (customLogoSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(customLogoSrc);
      }
    };
  }, [customLogoSrc]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !open) return;
    const sync = () => {
      const r = stage.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [open, aspectId]);

  const cropBox = (() => {
    const maxW = stageSize.w;
    const maxH = stageSize.h;
    let w = maxW;
    let h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    return {
      left: (maxW - w) / 2,
      top: (maxH - h) / 2,
      width: w,
      height: h,
    };
  })();

  const logoPreviewSizePx = Math.max(
    16,
    Math.min(cropBox.width || 200, cropBox.height || 200) * logoSize,
  );

  const updateLogoFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const sr = stage.getBoundingClientRect();
      const left = sr.left + cropBox.left;
      const top = sr.top + cropBox.top;
      const width = cropBox.width;
      const height = cropBox.height;
      if (width <= 0 || height <= 0) return;
      const sizeFrac = logoSizeRef.current;
      const short = Math.min(width, height);
      const logoW = short * sizeFrac;
      const logoH = short * sizeFrac;
      const rawX = (clientX - left - dragOffset.current.x) / width;
      const rawY = (clientY - top - dragOffset.current.y) / height;
      setLogoPos({
        x: clamp(rawX, 0, Math.max(0, 1 - logoW / width)),
        y: clamp(rawY, 0, Math.max(0, 1 - logoH / height)),
      });
    },
    [cropBox.height, cropBox.left, cropBox.top, cropBox.width],
  );

  useEffect(() => {
    if (!draggingLogo) return;
    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      updateLogoFromClient(e.clientX, e.clientY);
    };
    const onUp = () => setDraggingLogo(false);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [draggingLogo, updateLogoFromClient]);

  const onLogoPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (busy) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDraggingLogo(true);
  };

  const handleCustomLogo = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image (PNG, JPG, or WEBP)");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Logo must be under 3MB");
      return;
    }
    setError(null);
    if (customLogoSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(customLogoSrc);
    }
    setCustomLogoSrc(URL.createObjectURL(file));
    setLogoSource("custom");
    setWithLogo(true);
  };

  const ensureWorkVideo = async (src: string) => {
    let video = workVideoRef.current;
    if (!video) {
      video = document.createElement("video");
      video.playsInline = true;
      video.muted = true;
      video.preload = "auto";
      if (!isSameOriginSrc(src)) video.crossOrigin = "anonymous";
      workVideoRef.current = video;
    }
    const resolved = src.startsWith("/")
      ? `${window.location.origin}${src}`
      : src;
    if (video.getAttribute("data-editor-src") !== src) {
      video.setAttribute("data-editor-src", src);
      if (!isSameOriginSrc(src)) video.crossOrigin = "anonymous";
      else video.removeAttribute("crossorigin");
      video.src = resolved;
    }
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        video!.removeEventListener("loadeddata", onReady);
        video!.removeEventListener("error", onErr);
        resolve();
      };
      const onErr = () => {
        video!.removeEventListener("loadeddata", onReady);
        video!.removeEventListener("error", onErr);
        reject(new Error("Could not load video for export"));
      };
      if (video!.readyState >= 2) {
        resolve();
        return;
      }
      video!.addEventListener("loadeddata", onReady);
      video!.addEventListener("error", onErr);
      video!.load();
    });
    return video;
  };

  const handleApply = async () => {
    if (!videoSrc) return;
    if (withLogo && logoSource === "custom" && !customLogoSrc) {
      setError("Upload your logo, or switch to VIDYORA logo");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Video editing is not supported in this browser");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      setProgress("Preparing video…");
      const video = await ensureWorkVideo(videoSrc);
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error("Video could not be read");
      }
      if (duration > 40) {
        throw new Error("Keep videos under 40 seconds for crop & logo export");
      }

      const shortSide = 720;
      let outW = shortSide;
      let outH = Math.round(shortSide / aspect);
      if (aspect < 1) {
        outH = shortSide;
        outW = Math.round(shortSide * aspect);
      }

      let logo: HTMLImageElement | null = null;
      if (withLogo) {
        logo = await loadImage(activeLogoSrc);
      }

      setProgress("Exporting clean crop…");
      const cleanBlob = await recordPass({
        video,
        outW,
        outH,
        zoom,
        panX: pan.x,
        panY: pan.y,
        logo: null,
        logoPos,
        logoSize,
        logoOpacity,
      });

      let displayBlob = cleanBlob;
      if (withLogo && logo) {
        setProgress("Burning watermark…");
        displayBlob = await recordPass({
          video,
          outW,
          outH,
          zoom,
          panX: pan.x,
          panY: pan.y,
          logo,
          logoPos,
          logoSize,
          logoOpacity,
        });
      }

      const stamp = Date.now();
      const cleanFile = new File([cleanBlob], `product-video-clean-${stamp}.webm`, {
        type: cleanBlob.type || "video/webm",
      });
      const displayFile = new File(
        [displayBlob],
        `product-video-${stamp}.webm`,
        { type: displayBlob.type || "video/webm" },
      );

      await onApply({
        displayFile,
        cleanFile,
        hasWatermark: Boolean(withLogo && logo),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save video");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const videoStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: `${100 * zoom}%`,
    height: `${100 * zoom}%`,
    maxWidth: "none",
    transform: `translate(calc(-50% + ${pan.x * 12}%), calc(-50% + ${pan.y * 12}%))`,
    objectFit: "cover",
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="flex max-h-[min(94vh,900px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-100 px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl font-normal">
            <Film className="size-5 text-[#8b2e2e]" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Crop the video frame, optionally add a logo, then save. Storefront
            plays it muted on loop with no controls.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            ref={stageRef}
            className="relative isolate h-[min(52vh,360px)] overflow-hidden rounded-2xl bg-neutral-900"
          >
            {videoSrc ? (
              <>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="pointer-events-none absolute inset-0 size-full object-cover opacity-40"
                />
                <div
                  className="absolute overflow-hidden bg-black"
                  style={{
                    left: cropBox.left,
                    top: cropBox.top,
                    width: cropBox.width,
                    height: cropBox.height,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  }}
                >
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    src={videoSrc}
                    muted
                    loop
                    autoPlay
                    playsInline
                    style={videoStyle}
                  />
                  {withLogo && (
                    <div
                      className={cn(
                        "absolute z-10 select-none will-change-transform",
                        draggingLogo ? "cursor-grabbing" : "cursor-grab",
                      )}
                      style={{
                        left: `${logoPos.x * 100}%`,
                        top: `${logoPos.y * 100}%`,
                        width: logoPreviewSizePx,
                        opacity: logoOpacity,
                        touchAction: "none",
                      }}
                      onPointerDown={onLogoPointerDown}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeLogoSrc}
                        alt="Watermark"
                        draggable={false}
                        className="pointer-events-none w-full object-contain drop-shadow-md"
                      />
                      <span className="pointer-events-none absolute left-1/2 top-full mt-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-black/75 px-2 py-0.5 text-[10px] text-white shadow">
                        <Move className="size-2.5" />
                        Drag to place
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">
                <Film className="size-10" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={busy}
                onClick={() => setAspectId(opt.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  aspectId === opt.id
                    ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]/40",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm">Zoom</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {zoom.toFixed(1)}×
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                disabled={busy || zoom <= 1}
                onClick={() =>
                  setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(1))))
                }
              >
                <Minus className="size-4" />
              </Button>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.05}
                value={zoom}
                disabled={busy}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-[#8b2e2e]"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                disabled={busy || zoom >= 2.5}
                onClick={() =>
                  setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(1))))
                }
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm">Pan</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">Horizontal</p>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={pan.x}
                  disabled={busy || zoom <= 1}
                  onChange={(e) =>
                    setPan((p) => ({ ...p, x: Number(e.target.value) }))
                  }
                  className="h-2 w-full cursor-pointer accent-[#8b2e2e]"
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">Vertical</p>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={pan.y}
                  disabled={busy || zoom <= 1}
                  onChange={(e) =>
                    setPan((p) => ({ ...p, y: Number(e.target.value) }))
                  }
                  className="h-2 w-full cursor-pointer accent-[#8b2e2e]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-[#faf8f6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Watermark logo
                </p>
                <p className="text-xs text-muted-foreground">
                  Off = clean video. On = burn logo into the export.
                </p>
              </div>
              <Switch
                checked={withLogo}
                disabled={busy}
                onCheckedChange={setWithLogo}
              />
            </div>

            {withLogo && (
              <div className="mt-4 space-y-4 border-t border-neutral-200/80 pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setLogoSource("brand")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      logoSource === "brand"
                        ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                        : "border-neutral-200 bg-white text-neutral-700",
                    )}
                  >
                    VIDYORA logo
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setLogoSource("custom")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      logoSource === "custom"
                        ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                        : "border-neutral-200 bg-white text-neutral-700",
                    )}
                  >
                    Your logo
                  </button>
                </div>

                {logoSource === "custom" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="mr-1.5 size-3.5" />
                      Upload logo
                    </Button>
                    {customLogoSrc && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          if (customLogoSrc.startsWith("blob:")) {
                            URL.revokeObjectURL(customLogoSrc);
                          }
                          setCustomLogoSrc(null);
                          if (logoInputRef.current) logoInputRef.current.value = "";
                        }}
                      >
                        <X className="mr-1 size-3.5" />
                        Clear
                      </Button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleCustomLogo(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                )}

                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Logo size</span>
                    <span>{Math.round(logoSize * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.06}
                    max={0.28}
                    step={0.01}
                    value={logoSize}
                    disabled={busy}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-[#8b2e2e]"
                  />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Opacity</span>
                    <span>{Math.round(logoOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={1}
                    step={0.05}
                    value={logoOpacity}
                    disabled={busy}
                    onChange={(e) => setLogoOpacity(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-[#8b2e2e]"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {progress && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {progress}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 bg-white px-5 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !videoSrc}
            className="bg-[#8b2e2e] hover:bg-[#7a2828]"
            onClick={handleApply}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save video"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

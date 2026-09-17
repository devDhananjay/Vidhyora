"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import {
  Crop,
  Image as ImageIcon,
  Loader2,
  Minus,
  Move,
  Plus,
  RotateCcw,
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

/** Normalized top-left of logo within the crop frame (0–1). */
type LogoPos = { x: number; y: number };

export type EditedImageResult = {
  /** Final image shown on storefront (may include watermark). */
  displayFile: File;
  /** Clean crop without watermark — used for future edits. */
  cleanFile: File;
  hasWatermark: boolean;
};

type ProductImageEditorProps = {
  open: boolean;
  imageSrc: string | null;
  title?: string;
  onOpenChange: (open: boolean) => void;
  onApply: (result: EditedImageResult) => Promise<void> | void;
};

const ASPECT_OPTIONS: Array<{ id: string; label: string; value: number }> = [
  { id: "1:1", label: "Square", value: 1 },
  { id: "4:5", label: "Portrait", value: 4 / 5 },
  { id: "5:4", label: "Landscape", value: 5 / 4 },
];

const SNAP_PRESETS: Array<{ id: string; label: string; pos: LogoPos }> = [
  { id: "tl", label: "Top left", pos: { x: 0.04, y: 0.04 } },
  { id: "tr", label: "Top right", pos: { x: 0.72, y: 0.04 } },
  { id: "bl", label: "Bottom left", pos: { x: 0.04, y: 0.72 } },
  { id: "br", label: "Bottom right", pos: { x: 0.72, y: 0.72 } },
  { id: "c", label: "Center", pos: { x: 0.38, y: 0.38 } },
];

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
    // Setting crossOrigin on same-origin assets can break canvas export
    // when the response has no Access-Control-Allow-Origin header.
    if (!isSameOriginSrc(src)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

async function canvasToFile(canvas: HTMLCanvasElement, name: string) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export image"))),
      "image/jpeg",
      0.92,
    );
  });
  return new File([blob], name, { type: "image/jpeg" });
}

async function exportEditedImage(params: {
  imageSrc: string;
  crop: Area;
  withLogo: boolean;
  logoSrc: string;
  logoPos: LogoPos;
  logoOpacity: number;
  logoSize: number;
}): Promise<EditedImageResult> {
  const image = await loadImage(params.imageSrc);
  const outputSize = Math.min(
    1600,
    Math.max(params.crop.width, params.crop.height, 800),
  );
  const aspect = params.crop.width / Math.max(params.crop.height, 1);
  let outW = outputSize;
  let outH = Math.round(outputSize / aspect);
  if (aspect < 1) {
    outH = outputSize;
    outW = Math.round(outputSize * aspect);
  }

  const drawBase = (canvas: HTMLCanvasElement) => {
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(
      image,
      params.crop.x,
      params.crop.y,
      params.crop.width,
      params.crop.height,
      0,
      0,
      outW,
      outH,
    );
    return ctx;
  };

  const cleanCanvas = document.createElement("canvas");
  drawBase(cleanCanvas);
  const cleanFile = await canvasToFile(
    cleanCanvas,
    `product-clean-${Date.now()}.jpg`,
  );

  if (!params.withLogo || !params.logoSrc) {
    return { displayFile: cleanFile, cleanFile, hasWatermark: false };
  }

  const displayCanvas = document.createElement("canvas");
  const ctx = drawBase(displayCanvas);
  const logo = await loadImage(params.logoSrc);
  const target = Math.max(
    16,
    Math.round(Math.min(outW, outH) * params.logoSize),
  );
  const ratio = logo.width / Math.max(logo.height, 1);
  const logoW = target;
  const logoH = Math.round(target / ratio);
  const maxX = Math.max(0, outW - logoW);
  const maxY = Math.max(0, outH - logoH);
  // logoPos is top-left as a fraction of the cropped output (same as overlay).
  const x = clamp(Math.round(params.logoPos.x * outW), 0, maxX);
  const y = clamp(Math.round(params.logoPos.y * outH), 0, maxY);
  ctx.save();
  ctx.globalAlpha = params.logoOpacity;
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.restore();

  const displayFile = await canvasToFile(
    displayCanvas,
    `product-${Date.now()}.jpg`,
  );
  return { displayFile, cleanFile, hasWatermark: true };
}

export function ProductImageEditor({
  open,
  imageSrc,
  title = "Edit product photo",
  onOpenChange,
  onApply,
}: ProductImageEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const logoSizeRef = useRef(0.12);
  const draggingRef = useRef(false);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectId, setAspectId] = useState("1:1");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [withLogo, setWithLogo] = useState(false);
  const [logoSource, setLogoSource] = useState<LogoSource>("brand");
  const [customLogoSrc, setCustomLogoSrc] = useState<string | null>(null);
  const [logoPos, setLogoPos] = useState<LogoPos>({ x: 0.72, y: 0.72 });
  const [logoOpacity, setLogoOpacity] = useState(0.85);
  const [logoSize, setLogoSize] = useState(0.12);
  const [draggingLogo, setDraggingLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Crop frame as % of stage — logo is positioned inside this. */
  const [cropFrame, setCropFrame] = useState({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  });
  const [cropFramePx, setCropFramePx] = useState({ w: 0, h: 0 });

  const aspect = ASPECT_OPTIONS.find((a) => a.id === aspectId)?.value ?? 1;
  const activeLogoSrc =
    logoSource === "custom" && customLogoSrc
      ? customLogoSrc
      : BRAND_MONOGRAM_SRC;

  logoSizeRef.current = logoSize;
  draggingRef.current = draggingLogo;

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectId("1:1");
    setCroppedAreaPixels(null);
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
    setError(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }, [open, imageSrc]);

  useEffect(() => {
    return () => {
      if (customLogoSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(customLogoSrc);
      }
    };
  }, [customLogoSrc]);

  const syncCropFrame = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const area = stage.querySelector(
      ".reactEasyCrop_CropArea",
    ) as HTMLElement | null;
    if (!area) return;
    const sr = stage.getBoundingClientRect();
    const ar = area.getBoundingClientRect();
    if (sr.width <= 0 || sr.height <= 0) return;
    setCropFrame({
      left: ((ar.left - sr.left) / sr.width) * 100,
      top: ((ar.top - sr.top) / sr.height) * 100,
      width: (ar.width / sr.width) * 100,
      height: (ar.height / sr.height) * 100,
    });
    setCropFramePx({ w: ar.width, h: ar.height });
  }, []);

  useEffect(() => {
    if (!open || !imageSrc) return;
    const id = window.setTimeout(syncCropFrame, 50);
    const id2 = window.setTimeout(syncCropFrame, 200);
    const stage = stageRef.current;
    const ro = stage ? new ResizeObserver(() => syncCropFrame()) : null;
    if (stage && ro) ro.observe(stage);
    window.addEventListener("resize", syncCropFrame);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
      ro?.disconnect();
      window.removeEventListener("resize", syncCropFrame);
    };
  }, [open, imageSrc, crop, zoom, aspect, syncCropFrame]);

  const onCropComplete = useCallback(
    (_: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
      requestAnimationFrame(syncCropFrame);
    },
    [syncCropFrame],
  );

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
    const url = URL.createObjectURL(file);
    setCustomLogoSrc(url);
    setLogoSource("custom");
    setWithLogo(true);
  };

  const clearCustomLogo = () => {
    if (customLogoSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(customLogoSrc);
    }
    setCustomLogoSrc(null);
    setLogoSource("brand");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const updateLogoFromClient = useCallback((clientX: number, clientY: number) => {
    const frame = cropFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const sizeFrac = logoSizeRef.current;
    const short = Math.min(rect.width, rect.height);
    const logoW = short * sizeFrac;
    const logoH = short * sizeFrac;
    const rawX =
      (clientX - rect.left - dragOffset.current.x) / rect.width;
    const rawY =
      (clientY - rect.top - dragOffset.current.y) / rect.height;

    setLogoPos({
      x: clamp(rawX, 0, Math.max(0, 1 - logoW / rect.width)),
      y: clamp(rawY, 0, Math.max(0, 1 - logoH / rect.height)),
    });
  }, []);

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
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDraggingLogo(true);
  };

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    if (withLogo && logoSource === "custom" && !customLogoSrc) {
      setError("Upload your logo, or switch to VIDYORA logo");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await exportEditedImage({
        imageSrc,
        crop: croppedAreaPixels,
        withLogo,
        logoSrc: activeLogoSrc,
        logoPos,
        logoOpacity,
        logoSize,
      });
      await onApply(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save image");
    } finally {
      setBusy(false);
    }
  };

  const logoPreviewSizePx = Math.max(
    16,
    Math.min(cropFramePx.w || 200, cropFramePx.h || 200) * logoSize,
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="flex max-h-[min(94vh,900px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-100 px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl font-normal">
            <Crop className="size-5 text-[#8b2e2e]" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Crop and place your watermark on the photo. Turn watermark off to
            save a clean image (removes previous logo on re-edit).
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            ref={stageRef}
            className="relative isolate h-[min(52vh,360px)] overflow-hidden rounded-2xl bg-neutral-900 touch-none"
          >
            {imageSrc ? (
              <>
                <div
                  className="absolute inset-0 z-0"
                  style={draggingLogo ? { pointerEvents: "none" } : undefined}
                >
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={(next) => {
                      if (!draggingRef.current) setCrop(next);
                    }}
                    onZoomChange={(next) => {
                      if (!draggingRef.current) setZoom(next);
                    }}
                    onCropComplete={onCropComplete}
                    showGrid
                    objectFit="contain"
                    classes={{
                      containerClassName: "rounded-2xl !z-0",
                      mediaClassName: "!z-0",
                      cropAreaClassName: "!border-[#8b2e2e] !z-[1]",
                    }}
                  />
                </div>

                {/* Logo lives strictly inside the crop rectangle */}
                <div
                  ref={cropFrameRef}
                  className="pointer-events-none absolute z-[200]"
                  style={{
                    left: `${cropFrame.left}%`,
                    top: `${cropFrame.top}%`,
                    width: `${cropFrame.width}%`,
                    height: `${cropFrame.height}%`,
                  }}
                >
                  {withLogo && (
                    <div
                      className={cn(
                        "pointer-events-auto absolute select-none will-change-transform",
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
                <ImageIcon className="size-10" />
              </div>
            )}
          </div>

          <div className="space-y-3">
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
                  max={3}
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
                  disabled={busy || zoom >= 3}
                  onClick={() =>
                    setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(1))))
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100 bg-[#faf8f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Watermark logo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Off = clean photo. On = place logo, then drag on the crop.
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
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]/40",
                      )}
                    >
                      VIDYORA logo
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (customLogoSrc) setLogoSource("custom");
                        else logoInputRef.current?.click();
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        logoSource === "custom"
                          ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]/40",
                      )}
                    >
                      My logo
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeLogoSrc}
                        alt="Selected logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="mr-1.5 size-3.5" />
                        {customLogoSrc ? "Change logo" : "Upload logo"}
                      </Button>
                      {customLogoSrc ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={clearCustomLogo}
                        >
                          <X className="mr-1 size-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handleCustomLogo(e.target.files?.[0] || null)
                    }
                  />

                  <div>
                    <p className="mb-2 text-xs font-medium text-neutral-700">
                      Quick place
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SNAP_PRESETS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={busy}
                          onClick={() => setLogoPos(opt.pos)}
                          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-[#8b2e2e]/40"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">Logo size</span>
                      <span className="tabular-nums text-neutral-700">
                        {Math.round(logoSize * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.03}
                      max={0.4}
                      step={0.005}
                      value={logoSize}
                      disabled={busy}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer accent-[#8b2e2e]"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">Opacity</span>
                      <span className="tabular-nums text-neutral-700">
                        {Math.round(logoOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.25}
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
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-100 bg-white px-5 py-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="sm:mr-auto"
            disabled={busy}
            onClick={() => {
              setCrop({ x: 0, y: 0 });
              setZoom(1);
              setAspectId("1:1");
              setWithLogo(false);
              setLogoPos({ x: 0.72, y: 0.72 });
              setLogoSize(0.12);
              setLogoOpacity(0.85);
            }}
          >
            <RotateCcw className="mr-1.5 size-4" />
            Reset
          </Button>
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
            className="bg-[#8b2e2e] hover:bg-[#742626] sm:min-w-[140px]"
            disabled={busy || !imageSrc || !croppedAreaPixels}
            onClick={handleApply}
          >
            {busy ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Saving…
              </>
            ) : withLogo ? (
              "Save with logo"
            ) : (
              "Save clean photo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

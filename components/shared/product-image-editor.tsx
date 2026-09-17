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

/** Normalized top-left of logo within the crop (0–1). */
type LogoPos = { x: number; y: number };

type ProductImageEditorProps = {
  open: boolean;
  imageSrc: string | null;
  title?: string;
  onOpenChange: (open: boolean) => void;
  onApply: (file: File) => Promise<void> | void;
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (!src.startsWith("blob:") && !src.startsWith("data:")) {
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

async function exportEditedImage(params: {
  imageSrc: string;
  crop: Area;
  withLogo: boolean;
  logoSrc: string;
  logoPos: LogoPos;
  logoOpacity: number;
  logoSize: number;
}): Promise<File> {
  const image = await loadImage(params.imageSrc);
  const canvas = document.createElement("canvas");
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

  if (params.withLogo && params.logoSrc) {
    try {
      const logo = await loadImage(params.logoSrc);
      const target = Math.max(
        40,
        Math.round(Math.min(outW, outH) * params.logoSize),
      );
      const ratio = logo.width / Math.max(logo.height, 1);
      const logoW = target;
      const logoH = Math.round(target / ratio);
      const maxX = Math.max(0, outW - logoW);
      const maxY = Math.max(0, outH - logoH);
      const x = clamp(Math.round(params.logoPos.x * outW), 0, maxX);
      const y = clamp(Math.round(params.logoPos.y * outH), 0, maxY);
      ctx.save();
      ctx.globalAlpha = params.logoOpacity;
      ctx.drawImage(logo, x, y, logoW, logoH);
      ctx.restore();
    } catch {
      // Crop still applies if logo fails
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export image"))),
      "image/jpeg",
      0.92,
    );
  });

  return new File([blob], `product-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export function ProductImageEditor({
  open,
  imageSrc,
  title = "Edit product photo",
  onOpenChange,
  onApply,
}: ProductImageEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectId, setAspectId] = useState("1:1");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [withLogo, setWithLogo] = useState(false);
  const [logoSource, setLogoSource] = useState<LogoSource>("brand");
  const [customLogoSrc, setCustomLogoSrc] = useState<string | null>(null);
  const [logoPos, setLogoPos] = useState<LogoPos>({ x: 0.72, y: 0.72 });
  const [logoOpacity, setLogoOpacity] = useState(0.85);
  const [logoSize, setLogoSize] = useState(0.18);
  const [draggingLogo, setDraggingLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = ASPECT_OPTIONS.find((a) => a.id === aspectId)?.value ?? 1;
  const activeLogoSrc =
    logoSource === "custom" && customLogoSrc
      ? customLogoSrc
      : BRAND_MONOGRAM_SRC;

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectId("1:1");
    setCroppedAreaPixels(null);
    setWithLogo(false);
    setLogoSource("brand");
    setLogoPos({ x: 0.72, y: 0.72 });
    setLogoOpacity(0.85);
    setLogoSize(0.18);
    setDraggingLogo(false);
    setBusy(false);
    setError(null);
  }, [open, imageSrc]);

  useEffect(() => {
    return () => {
      if (customLogoSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(customLogoSrc);
      }
    };
  }, [customLogoSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

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

  const updateLogoFromClient = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const sizeFrac = logoSize;
    const logoWFrac = sizeFrac;
    const logoHFrac = sizeFrac; // approximate; exact ratio applied on export

    const rawX =
      (clientX - rect.left - dragOffset.current.x) / rect.width;
    const rawY =
      (clientY - rect.top - dragOffset.current.y) / rect.height;

    setLogoPos({
      x: clamp(rawX, 0, Math.max(0, 1 - logoWFrac)),
      y: clamp(rawY, 0, Math.max(0, 1 - logoHFrac)),
    });
  };

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
    target.setPointerCapture(e.pointerId);
    setDraggingLogo(true);
  };

  const onLogoPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingLogo) return;
    e.preventDefault();
    e.stopPropagation();
    updateLogoFromClient(e.clientX, e.clientY);
  };

  const onLogoPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingLogo) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDraggingLogo(false);
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
      const file = await exportEditedImage({
        imageSrc,
        crop: croppedAreaPixels,
        withLogo,
        logoSrc: activeLogoSrc,
        logoPos,
        logoOpacity,
        logoSize,
      });
      await onApply(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="flex max-h-[min(94vh,900px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-100 px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl font-normal">
            <Crop className="size-5 text-[#8b2e2e]" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Crop, zoom, upload your logo as watermark, and drag it anywhere on
            the photo.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            ref={stageRef}
            className="relative h-[min(52vh,360px)] overflow-hidden rounded-2xl bg-neutral-900 touch-none"
          >
            {imageSrc ? (
              <>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={(next) => {
                    if (!draggingLogo) setCrop(next);
                  }}
                  onZoomChange={(next) => {
                    if (!draggingLogo) setZoom(next);
                  }}
                  onCropComplete={onCropComplete}
                  showGrid
                  objectFit="contain"
                  classes={{
                    containerClassName: "rounded-2xl",
                    cropAreaClassName: "!border-[#8b2e2e]",
                  }}
                />

                {withLogo && (
                  <div
                    className={cn(
                      "absolute z-30 select-none",
                      draggingLogo ? "cursor-grabbing" : "cursor-grab",
                    )}
                    style={{
                      left: `${logoPos.x * 100}%`,
                      top: `${logoPos.y * 100}%`,
                      width: `${logoSize * 100}%`,
                      maxWidth: 120,
                      opacity: logoOpacity,
                      touchAction: "none",
                    }}
                    onPointerDown={onLogoPointerDown}
                    onPointerMove={onLogoPointerMove}
                    onPointerUp={onLogoPointerUp}
                    onPointerCancel={onLogoPointerUp}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeLogoSrc}
                      alt="Watermark"
                      draggable={false}
                      className="pointer-events-none w-full object-contain drop-shadow-md"
                    />
                    <span className="pointer-events-none absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                      <Move className="size-2.5" />
                      Drag to place
                    </span>
                  </div>
                )}
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
                    Use VIDYORA or upload your own — then drag it on the photo
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
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Or drag the logo on the preview to place it exactly where
                      you want.
                    </p>
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
                      min={0.08}
                      max={0.4}
                      step={0.01}
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
              setLogoSize(0.18);
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
            ) : (
              "Save photo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

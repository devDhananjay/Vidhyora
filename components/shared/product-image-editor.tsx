"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import {
  Crop,
  Image as ImageIcon,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
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

export type LogoCorner = "br" | "bl" | "tr" | "tl";

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

const CORNER_OPTIONS: Array<{ id: LogoCorner; label: string }> = [
  { id: "br", label: "Bottom right" },
  { id: "bl", label: "Bottom left" },
  { id: "tr", label: "Top right" },
  { id: "tl", label: "Top left" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function cornerOffset(
  corner: LogoCorner,
  canvasW: number,
  canvasH: number,
  logoW: number,
  logoH: number,
  pad: number,
) {
  switch (corner) {
    case "tl":
      return { x: pad, y: pad };
    case "tr":
      return { x: canvasW - logoW - pad, y: pad };
    case "bl":
      return { x: pad, y: canvasH - logoH - pad };
    case "br":
    default:
      return { x: canvasW - logoW - pad, y: canvasH - logoH - pad };
  }
}

async function exportEditedImage(params: {
  imageSrc: string;
  crop: Area;
  withLogo: boolean;
  logoCorner: LogoCorner;
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

  if (params.withLogo) {
    try {
      const logo = await loadImage(BRAND_MONOGRAM_SRC);
      const target = Math.max(48, Math.round(Math.min(outW, outH) * params.logoSize));
      const ratio = logo.width / Math.max(logo.height, 1);
      const logoW = target;
      const logoH = Math.round(target / ratio);
      const pad = Math.round(Math.min(outW, outH) * 0.04);
      const { x, y } = cornerOffset(
        params.logoCorner,
        outW,
        outH,
        logoW,
        logoH,
        pad,
      );
      ctx.save();
      ctx.globalAlpha = params.logoOpacity;
      ctx.drawImage(logo, x, y, logoW, logoH);
      ctx.restore();
    } catch {
      // Logo optional — crop still applies if brand asset fails
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
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectId, setAspectId] = useState("1:1");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [withLogo, setWithLogo] = useState(false);
  const [logoCorner, setLogoCorner] = useState<LogoCorner>("br");
  const [logoOpacity, setLogoOpacity] = useState(0.85);
  const [logoSize, setLogoSize] = useState(0.16);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect =
    ASPECT_OPTIONS.find((a) => a.id === aspectId)?.value ?? 1;

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectId("1:1");
    setCroppedAreaPixels(null);
    setWithLogo(false);
    setLogoCorner("br");
    setLogoOpacity(0.85);
    setLogoSize(0.16);
    setBusy(false);
    setError(null);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const file = await exportEditedImage({
        imageSrc,
        crop: croppedAreaPixels,
        withLogo,
        logoCorner,
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

  const logoPreviewStyle = (() => {
    const sizePct = `${Math.round(logoSize * 100)}%`;
    const base: CSSProperties = {
      width: sizePct,
      maxWidth: 88,
      opacity: logoOpacity,
      pointerEvents: "none",
    };
    if (logoCorner === "tl") return { ...base, top: "10%", left: "10%" };
    if (logoCorner === "tr") return { ...base, top: "10%", right: "10%" };
    if (logoCorner === "bl") return { ...base, bottom: "10%", left: "10%" };
    return { ...base, bottom: "10%", right: "10%" };
  })();

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="flex max-h-[min(94vh,880px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-100 px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl font-normal">
            <Crop className="size-5 text-[#8b2e2e]" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Crop, zoom, and optionally place the VIDYORA logo before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="relative h-[min(52vh,360px)] overflow-hidden rounded-2xl bg-neutral-900">
            {imageSrc ? (
              <>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid
                  objectFit="contain"
                  classes={{
                    containerClassName: "rounded-2xl",
                    cropAreaClassName: "!border-[#8b2e2e]",
                  }}
                />
                {withLogo && (
                  // Approximate corner preview over the crop stage
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={BRAND_MONOGRAM_SRC}
                    alt=""
                    className="absolute z-20 object-contain drop-shadow-md"
                    style={logoPreviewStyle}
                  />
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
                  onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(1))))}
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
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(1))))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100 bg-[#faf8f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Add VIDYORA logo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Soft monogram watermark on the cropped photo
                  </p>
                </div>
                <Switch
                  checked={withLogo}
                  disabled={busy}
                  onCheckedChange={setWithLogo}
                />
              </div>

              {withLogo && (
                <div className="mt-4 space-y-3 border-t border-neutral-200/80 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {CORNER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={busy}
                        onClick={() => setLogoCorner(opt.id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          logoCorner === opt.id
                            ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]/40",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
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
                      min={0.1}
                      max={0.28}
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
                      min={0.35}
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

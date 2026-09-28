"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Film, ImageIcon, Loader2, Upload } from "lucide-react";
import { uploadHomepageMedia } from "@/actions/admin/upload-homepage-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isVideoUrl } from "@/lib/media/is-video-url";
import {
  HOMEPAGE_MEDIA_FITS,
  type HomepageMediaFit,
} from "@/lib/media/homepage-media-fit";
import { cn } from "@/lib/utils";

type MediaUrlFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
  previewClassName?: string;
  /**
   * When set, uploads are auto-cropped/resized to the homepage canvas
   * (hero = 1920×576 10:3, square = 1200×1200, etc.).
   */
  fit?: HomepageMediaFit;
};

/**
 * Homepage CMS field: paste URL or upload image OR video.
 * Storefront detects type from the file extension.
 */
export function MediaUrlField({
  label,
  value,
  onChange,
  hint,
  className,
  previewClassName,
  fit,
}: MediaUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fittedNote, setFittedNote] = useState<string | null>(null);
  const isVideo = isVideoUrl(value);
  const fitMeta = fit ? HOMEPAGE_MEDIA_FITS[fit] : null;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setFittedNote(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (fit) formData.append("fit", fit);
      const result = await uploadHomepageMedia(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onChange(result.data.url);
      if (result.data.fitted && fitMeta) {
        setFittedNote(`Auto-fitted to ${fitMeta.aspectLabel} for homepage.`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload media";
      if (/Body exceeded|413|too large/i.test(message)) {
        setError(
          "File is too large for upload. Use an image ≤8 MB or video ≤40 MB.",
        );
      } else {
        setError("Failed to upload media. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap items-center gap-2">
          {fitMeta ? (
            <span className="rounded-md bg-[#8b2e2e]/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#8b2e2e]">
              Size: {fitMeta.width}×{fitMeta.height}px
            </span>
          ) : null}
          {value ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {isVideo ? (
                <>
                  <Film className="size-3" /> Video
                </>
              ) : (
                <>
                  <ImageIcon className="size-3" /> Image
                </>
              )}
            </span>
          ) : null}
        </div>
      </div>
      {fitMeta ? (
        <div className="rounded-lg border border-[#ead9c4] bg-[#faf7f5] px-3 py-2 text-xs text-neutral-700">
          <p className="font-semibold text-[#8b2e2e]">
            Banner size: {fitMeta.aspectLabel}
          </p>
          <p className="mt-0.5 text-muted-foreground">{fitMeta.hint}</p>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /uploads/homepage/…"
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="shrink-0 gap-2"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading
            ? fit
              ? "Fitting…"
              : "Uploading…"
            : "Upload"}
        </Button>
      </div>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : !fitMeta ? (
        <p className="text-xs text-muted-foreground">
          Upload image (JPG/PNG/WEBP ≤8 MB) or video (MP4/WEBM ≤40 MB), or paste a
          URL. Swap anytime — image slots accept video and vice versa.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          JPG/PNG/WEBP ≤8 MB or MP4/WEBM ≤40 MB. Prefer designing at{" "}
          {fitMeta.width}×{fitMeta.height} so important faces stay in the safe
          center.
        </p>
      )}
      {fittedNote ? (
        <p className="text-xs font-medium text-[#8b2e2e]">{fittedNote}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {value ? (
        <div
          className={cn(
            "relative mt-1 w-full overflow-hidden rounded-lg bg-muted",
            fit === "hero"
              ? "aspect-[10/3] sm:max-w-xl"
              : fit === "square"
                ? "aspect-square sm:w-40"
                : "h-28 sm:w-48",
            previewClassName,
          )}
        >
          {isVideo ? (
            <video
              src={value}
              muted
              playsInline
              loop
              autoPlay
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={value}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

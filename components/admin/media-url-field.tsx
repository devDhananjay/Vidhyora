"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Film, ImageIcon, Loader2, Upload } from "lucide-react";
import { uploadHomepageMedia } from "@/actions/admin/upload-homepage-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isVideoUrl } from "@/lib/media/is-video-url";
import { cn } from "@/lib/utils";

type MediaUrlFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
  previewClassName?: string;
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
}: MediaUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isVideo = isVideoUrl(value);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadHomepageMedia(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onChange(result.data.url);
    } catch {
      setError("Failed to upload media");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
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
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Upload image (JPG/PNG/WEBP ≤5 MB) or video (MP4/WEBM ≤40 MB), or paste a
          URL. Swap anytime — image slots accept video and vice versa.
        </p>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {value ? (
        <div
          className={cn(
            "relative mt-1 h-28 w-full overflow-hidden rounded-lg bg-muted sm:w-48",
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

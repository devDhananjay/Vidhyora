"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { uploadMegaMenuImage } from "@/actions/admin/upload-mega-menu-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ImageUrlFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
  previewClassName?: string;
};

export function ImageUrlField({
  label,
  value,
  onChange,
  hint,
  className,
  previewClassName,
}: ImageUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadMegaMenuImage(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onChange(result.data.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /uploads/mega-menu/…"
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
          Upload from laptop (JPG/PNG/WEBP, max 5 MB) or paste an image URL.
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
          <Image
            src={value}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
    </div>
  );
}

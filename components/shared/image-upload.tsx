"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadProductImage } from "@/actions/seller/upload-product-image";

type ImageUploadProps = {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
};

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);

    try {
      const fileArray = Array.from(files);

      if (value.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} images allowed`);
        setIsUploading(false);
        return;
      }

      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`Each image must be under ${maxSize}MB`);
        }
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadProductImage(formData);
        if (!result.success) {
          throw new Error(result.error || "Failed to upload image");
        }
        uploadedUrls.push(result.data.url);
      }

      onChange([...value, ...uploadedUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const canUploadMore = value.length < maxFiles;

  return (
    <div className={cn("space-y-4", className)}>
      {canUploadMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          <Upload className="mb-4 size-10 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium">
            {isDragging ? "Drop images here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP up to {maxSize}MB ({maxFiles - value.length} remaining)
          </p>
          {isUploading && (
            <div className="mt-4">
              <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
                <div className="h-full animate-pulse bg-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Uploading...</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                unoptimized={url.startsWith("data:")}
                className="object-cover"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleRemove(index)}
                >
                  <X className="size-4" />
                </Button>
              )}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                  Thumbnail
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !canUploadMore && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-muted-foreground">
          <ImageIcon className="mb-4 size-10" />
          <p className="text-sm">No images uploaded</p>
        </div>
      )}
    </div>
  );
}

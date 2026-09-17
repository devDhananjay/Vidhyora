"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import {
  Check,
  Image as ImageIcon,
  Pencil,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadProductImage } from "@/actions/seller/upload-product-image";
import {
  ProductImageEditor,
  type EditedImageResult,
} from "@/components/shared/product-image-editor";

export type UploadImageItem = {
  url: string;
  /** Clean crop without watermark — used when re-editing. */
  sourceUrl?: string;
};

type ImageUploadProps = {
  value?: string[];
  onChange: (urls: string[], sources?: Record<string, string>) => void;
  /** Parallel map displayUrl → clean sourceUrl for watermark re-edit. */
  sourceByUrl?: Record<string, string>;
  onSourceByUrlChange?: (map: Record<string, string>) => void;
  thumbnailUrl?: string;
  onThumbnailChange?: (url: string) => void;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  enableEditor?: boolean;
};

type EditorSession = {
  src: string;
  replaceUrl?: string;
  revokeOnClose?: boolean;
  queue?: File[];
};

export function ImageUpload({
  value = [],
  onChange,
  sourceByUrl = {},
  onSourceByUrlChange,
  thumbnailUrl,
  onThumbnailChange,
  maxFiles = 5,
  maxSize = 5,
  disabled = false,
  className,
  enableEditor = true,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorSession | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  const sourcesRef = useRef(sourceByUrl);
  valueRef.current = value;
  sourcesRef.current = sourceByUrl;

  const activeThumbnail =
    thumbnailUrl && value.includes(thumbnailUrl) ? thumbnailUrl : value[0] || "";

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProductImage(formData);
    if (!result.success) {
      throw new Error(result.error || "Failed to upload image");
    }
    return result.data.url;
  };

  const patchSources = (
    next: Record<string, string>,
    removeKeys: string[] = [],
  ) => {
    const merged = { ...sourcesRef.current, ...next };
    for (const key of removeKeys) delete merged[key];
    sourcesRef.current = merged;
    onSourceByUrlChange?.(merged);
  };

  const closeEditor = () => {
    setEditor((prev) => {
      if (prev?.revokeOnClose && prev.src.startsWith("blob:")) {
        URL.revokeObjectURL(prev.src);
      }
      return null;
    });
  };

  const openNextFromQueue = (queue: File[]) => {
    const [next, ...rest] = queue;
    if (!next) {
      closeEditor();
      return;
    }
    if (next.size > maxSize * 1024 * 1024) {
      setError(`Each image must be under ${maxSize}MB`);
      openNextFromQueue(rest);
      return;
    }
    const src = URL.createObjectURL(next);
    setEditor({
      src,
      revokeOnClose: true,
      queue: rest,
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const fileArray = Array.from(files);

    if (value.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    for (const file of fileArray) {
      if (file.size > maxSize * 1024 * 1024) {
        setError(`Each image must be under ${maxSize}MB`);
        return;
      }
    }

    if (enableEditor) {
      openNextFromQueue(fileArray);
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        uploadedUrls.push(await uploadFile(file));
      }
      const next = [...value, ...uploadedUrls];
      onChange(next);
      if (!activeThumbnail && next[0]) {
        onThumbnailChange?.(next[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditorApply = async (result: EditedImageResult) => {
    setIsUploading(true);
    setError(null);
    try {
      const cleanUrl = await uploadFile(result.cleanFile);
      const displayUrl = result.hasWatermark
        ? await uploadFile(result.displayFile)
        : cleanUrl;

      const current = valueRef.current;
      const replaceUrl = editor?.replaceUrl;
      const queue = editor?.queue || [];

      if (replaceUrl) {
        const next = current.map((u) => (u === replaceUrl ? displayUrl : u));
        const nextSources = { ...sourcesRef.current, [displayUrl]: cleanUrl };
        delete nextSources[replaceUrl];
        sourcesRef.current = nextSources;
        onChange(next, nextSources);
        onSourceByUrlChange?.(nextSources);
        if (activeThumbnail === replaceUrl) {
          onThumbnailChange?.(displayUrl);
        }
        if (editor?.revokeOnClose && editor.src.startsWith("blob:")) {
          URL.revokeObjectURL(editor.src);
        }
        setEditor(null);
      } else {
        const next = [...current, displayUrl];
        const nextSources = { ...sourcesRef.current, [displayUrl]: cleanUrl };
        sourcesRef.current = nextSources;
        onChange(next, nextSources);
        onSourceByUrlChange?.(nextSources);
        if (!activeThumbnail && next[0]) {
          onThumbnailChange?.(next[0]);
        }
        if (editor?.revokeOnClose && editor.src.startsWith("blob:")) {
          URL.revokeObjectURL(editor.src);
        }
        if (queue.length > 0) {
          openNextFromQueue(queue);
        } else {
          setEditor(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      throw err;
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditExisting = (url: string) => {
    setError(null);
    // Prefer clean source so watermark can be moved / removed
    const src = sourcesRef.current[url] || sourceByUrl[url] || url;
    setEditor({
      src,
      replaceUrl: url,
      revokeOnClose: false,
    });
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
    const removed = value[index];
    const next = value.filter((_, i) => i !== index);
    onChange(next);
    if (removed) {
      patchSources({}, [removed]);
    }
    if (removed === activeThumbnail) {
      onThumbnailChange?.(next[0] || "");
    }
  };

  const canUploadMore = value.length < maxFiles;
  const queueLeft = editor?.queue?.length ?? 0;

  return (
    <div className={cn("space-y-4", className)}>
      {canUploadMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-[#8b2e2e] bg-[#8b2e2e]/5"
              : "border-muted-foreground/25 hover:border-[#8b2e2e]/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleChange}
            disabled={disabled || isUploading || Boolean(editor)}
            className="hidden"
          />

          <Upload className="mb-4 size-10 text-[#8b2e2e]" />
          <p className="mb-2 text-sm font-medium">
            {isDragging
              ? "Drop images here"
              : enableEditor
                ? "Upload photos to crop & brand"
                : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP up to {maxSize}MB · crop, zoom & logo
            {canUploadMore ? ` · ${maxFiles - value.length} left` : ""}
          </p>
          {isUploading && (
            <div className="mt-4">
              <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
                <div className="h-full animate-pulse bg-[#8b2e2e]" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>
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
          {value.map((url, index) => {
            const isThumb = url === activeThumbnail;
            return (
              <div
                key={url}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl border bg-muted",
                  isThumb && "ring-2 ring-[#8b2e2e] ring-offset-2",
                )}
              >
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  unoptimized={url.startsWith("data:") || url.startsWith("blob:")}
                  className="object-cover"
                />
                {!disabled && (
                  <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {enableEditor && (
                      <Button
                        type="button"
                        size="icon"
                        className="size-7 bg-black/65 text-white hover:bg-black/80"
                        onClick={() => handleEditExisting(url)}
                        title="Crop / logo / zoom"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="size-7"
                      onClick={() => handleRemove(index)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}
                {isThumb ? (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-[#8b2e2e] px-2 py-1 text-xs font-medium text-white">
                    <Check className="size-3" />
                    Thumbnail
                  </div>
                ) : (
                  !disabled &&
                  onThumbnailChange && (
                    <button
                      type="button"
                      onClick={() => onThumbnailChange(url)}
                      className="absolute inset-x-2 bottom-2 rounded bg-black/70 px-2 py-1.5 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/85"
                    >
                      Set as thumbnail
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {value.length === 0 && !canUploadMore && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-muted-foreground">
          <ImageIcon className="mb-4 size-10" />
          <p className="text-sm">No images uploaded</p>
        </div>
      )}

      <ProductImageEditor
        open={Boolean(editor)}
        imageSrc={editor?.src ?? null}
        title={
          editor?.replaceUrl
            ? "Edit product photo"
            : queueLeft > 0
              ? `Edit photo · ${queueLeft} more in queue`
              : "Edit product photo"
        }
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
        onApply={handleEditorApply}
      />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  Film,
  GripVertical,
  Loader2,
  Pencil,
  Upload,
  X,
} from "lucide-react";
import {
  ProductImageEditor,
  type EditedImageResult,
} from "@/components/shared/product-image-editor";
import {
  ProductVideoEditor,
  type EditedVideoResult,
} from "@/components/shared/product-video-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadProductImage } from "@/actions/seller/upload-product-image";
import { uploadProductVideo } from "@/actions/seller/upload-product-video";
import { cn } from "@/lib/utils";
import { isVideoUrl } from "@/lib/media/is-video-url";

type MediaItem = {
  url: string;
  sourceUrl?: string;
  altText?: string;
  kind: "IMAGE" | "VIDEO";
  role?: "PRODUCT" | "ON_MODEL" | "DETAIL";
  sortOrder: number;
};

type ImagesStepProps = {
  watch: any;
  setValue: any;
  errors: any;
};

const MAX_PHOTOS = 5;
const MAX_VIDEOS = 1;

async function uploadBlob(file: File, asVideo: boolean) {
  const formData = new FormData();
  formData.append("file", file);
  if (asVideo) {
    const result = await uploadProductVideo(formData);
    if (!result.success) throw new Error(result.error || "Video upload failed");
    return result.data.url;
  }
  const result = await uploadProductImage(formData);
  if (!result.success) throw new Error(result.error || "Image upload failed");
  return result.data.url;
}

export function ImagesStep({ watch, setValue, errors }: ImagesStepProps) {
  const currentImages: MediaItem[] = (watch("images") || []).map(
    (img: MediaItem, index: number) => ({
      url: img.url,
      sourceUrl: img.sourceUrl || img.url,
      altText: img.altText,
      kind:
        img.kind === "VIDEO" || isVideoUrl(img.url) ? "VIDEO" : "IMAGE",
      role:
        img.kind === "VIDEO" || isVideoUrl(img.url)
          ? "PRODUCT"
          : img.role === "ON_MODEL" || img.role === "DETAIL"
            ? img.role
            : "PRODUCT",
      sortOrder: img.sortOrder ?? index,
    }),
  );
  const thumbnail = watch("thumbnail") || "";
  const productName = watch("name") || "Product image";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [imageEditor, setImageEditor] = useState<{
    src: string;
    replaceUrl?: string;
    revokeOnClose?: boolean;
    queue?: File[];
  } | null>(null);
  const [videoEditor, setVideoEditor] = useState<{
    src: string;
    replaceUrl?: string;
    revokeOnClose?: boolean;
  } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const photoCount = currentImages.filter((i) => i.kind === "IMAGE").length;
  const videoCount = currentImages.filter((i) => i.kind === "VIDEO").length;
  const canAddPhoto = photoCount < MAX_PHOTOS;
  const canAddVideo = videoCount < MAX_VIDEOS;

  const commitMedia = (items: MediaItem[], nextThumbnail?: string) => {
    const normalized = items.map((item, index) => ({
      ...item,
      altText: item.altText || productName,
      sortOrder: index,
    }));
    setValue("images", normalized, { shouldValidate: true, shouldDirty: true });

    const photos = normalized.filter((i) => i.kind === "IMAGE");
    const video = normalized.find((i) => i.kind === "VIDEO");
    setValue("videoUrl", video?.url || undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });

    let thumb = nextThumbnail ?? thumbnail;
    if (thumb && !photos.some((p) => p.url === thumb)) {
      thumb = photos[0]?.url || "";
    }
    if (!thumb) thumb = photos[0]?.url || "";
    setValue("thumbnail", thumb, { shouldValidate: true, shouldDirty: true });
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...currentImages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commitMedia(next);
  };

  const removeAt = (index: number) => {
    const removed = currentImages[index];
    const next = currentImages.filter((_, i) => i !== index);
    commitMedia(
      next,
      removed?.url === thumbnail ? undefined : thumbnail,
    );
  };

  const openPhotoQueue = (files: File[]) => {
    if (!files.length) return;
    const [first, ...rest] = files;
    const src = URL.createObjectURL(first);
    setImageEditor({
      src,
      revokeOnClose: true,
      queue: rest,
    });
  };

  const handlePhotoFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const remaining = MAX_PHOTOS - photoCount;
    const files = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    if (!files.length) {
      setError("Choose image files (JPG, PNG, WEBP)");
      return;
    }
    openPhotoQueue(files);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleVideoFile = (file: File | null) => {
    if (!file) return;
    if (!canAddVideo && !videoEditor?.replaceUrl) {
      setError("Only one product video is allowed");
      return;
    }
    setError(null);
    const src = URL.createObjectURL(file);
    setVideoEditor({ src, revokeOnClose: true });
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const closeImageEditor = () => {
    if (imageEditor?.revokeOnClose && imageEditor.src.startsWith("blob:")) {
      URL.revokeObjectURL(imageEditor.src);
    }
    setImageEditor(null);
  };

  const closeVideoEditor = () => {
    if (videoEditor?.revokeOnClose && videoEditor.src.startsWith("blob:")) {
      URL.revokeObjectURL(videoEditor.src);
    }
    setVideoEditor(null);
  };

  const handleImageApply = async (result: EditedImageResult) => {
    setBusy(true);
    setError(null);
    try {
      const cleanUrl = await uploadBlob(result.cleanFile, false);
      const displayUrl = result.hasWatermark
        ? await uploadBlob(result.displayFile, false)
        : cleanUrl;

      const replaceUrl = imageEditor?.replaceUrl;
      const queue = imageEditor?.queue || [];

      if (replaceUrl) {
        const next = currentImages.map((item) =>
          item.url === replaceUrl
            ? {
                ...item,
                url: displayUrl,
                sourceUrl: cleanUrl,
                kind: "IMAGE" as const,
              }
            : item,
        );
        commitMedia(
          next,
          thumbnail === replaceUrl ? displayUrl : thumbnail,
        );
        closeImageEditor();
      } else {
        const next = [
          ...currentImages,
          {
            url: displayUrl,
            sourceUrl: cleanUrl,
            altText: productName,
            kind: "IMAGE" as const,
            sortOrder: currentImages.length,
          },
        ];
        commitMedia(next, thumbnail || displayUrl);
        if (imageEditor?.revokeOnClose && imageEditor.src.startsWith("blob:")) {
          URL.revokeObjectURL(imageEditor.src);
        }
        if (queue.length > 0) {
          openPhotoQueue(queue);
        } else {
          setImageEditor(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const handleVideoApply = async (result: EditedVideoResult) => {
    setBusy(true);
    setError(null);
    try {
      const cleanUrl = await uploadBlob(result.cleanFile, true);
      const displayUrl = result.hasWatermark
        ? await uploadBlob(result.displayFile, true)
        : cleanUrl;

      const replaceUrl = videoEditor?.replaceUrl;
      if (replaceUrl) {
        const next = currentImages.map((item) =>
          item.url === replaceUrl
            ? {
                ...item,
                url: displayUrl,
                sourceUrl: cleanUrl,
                kind: "VIDEO" as const,
              }
            : item,
        );
        commitMedia(next);
      } else {
        // Remove any existing video first (max 1)
        const withoutVideo = currentImages.filter((i) => i.kind !== "VIDEO");
        commitMedia([
          ...withoutVideo,
          {
            url: displayUrl,
            sourceUrl: cleanUrl,
            altText: `${productName} video`,
            kind: "VIDEO",
            sortOrder: withoutVideo.length,
          },
        ]);
      }
      closeVideoEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video");
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const editExisting = (item: MediaItem) => {
    const src = item.sourceUrl || item.url;
    if (item.kind === "VIDEO") {
      setVideoEditor({ src, replaceUrl: item.url, revokeOnClose: false });
    } else {
      setImageEditor({ src, replaceUrl: item.url, revokeOnClose: false });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Label>Product media *</Label>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload photos and one video. Drag cards to set gallery order. Crop and
          add a logo on both photos and video before saving.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !canAddPhoto}
            onClick={() => photoInputRef.current?.click()}
          >
            <Upload className="mr-1.5 size-4" />
            Add photos
            <span className="ml-1 text-muted-foreground">
              ({photoCount}/{MAX_PHOTOS})
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || (!canAddVideo && videoCount === 0)}
            onClick={() => videoInputRef.current?.click()}
          >
            <Film className="mr-1.5 size-4" />
            {videoCount ? "Replace video" : "Add video"}
          </Button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handlePhotoFiles(e.target.files)}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => handleVideoFile(e.target.files?.[0] || null)}
          />
        </div>

        {currentImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {currentImages.map((item, index) => {
              const isThumb =
                item.kind === "IMAGE" && item.url === thumbnail;
              const isOver = overIndex === index && dragIndex !== index;
              return (
                <div
                  key={`${item.kind}-${item.url}`}
                  draggable={!busy}
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverIndex(index);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex != null) reorder(dragIndex, index);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border bg-muted transition",
                    isThumb && "ring-2 ring-[#8b2e2e] ring-offset-2",
                    isOver && "border-[#8b2e2e] border-dashed",
                    dragIndex === index && "opacity-60",
                  )}
                >
                  {item.kind === "VIDEO" ? (
                    <div className="absolute inset-0 bg-neutral-900">
                      {/* #t=0.1 forces Safari/Chrome to paint a preview frame */}
                      <video
                        src={`${item.url}${item.url.includes("#") ? "" : "#t=0.1"}`}
                        muted
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 size-full object-cover"
                        onLoadedData={(e) => {
                          const el = e.currentTarget;
                          try {
                            if (el.currentTime < 0.05) el.currentTime = 0.1;
                          } catch {
                            /* ignore seek errors */
                          }
                        }}
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                        <Film className="size-7 text-white/90 drop-shadow" />
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.altText || `Media ${index + 1}`}
                      fill
                      unoptimized={
                        item.url.startsWith("data:") ||
                        item.url.startsWith("blob:")
                      }
                      className="object-cover"
                    />
                  )}

                  <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
                    <span className="flex cursor-grab items-center rounded bg-black/65 px-1.5 py-1 text-white active:cursor-grabbing">
                      <GripVertical className="size-3.5" />
                      <span className="text-[10px] font-semibold">
                        {index + 1}
                      </span>
                    </span>
                    {item.kind === "VIDEO" ? (
                      <span className="flex size-6 items-center justify-center rounded-full border border-white/40 bg-[#8b2e2e] text-white">
                        <Film className="size-3" strokeWidth={1.8} />
                        <span className="sr-only">Video</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      size="icon"
                      className="size-7 bg-black/65 text-white hover:bg-black/80"
                      onClick={() => editExisting(item)}
                      title="Crop / logo"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="size-7"
                      onClick={() => removeAt(index)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>

                  {item.kind === "IMAGE" ? (
                    <div className="absolute inset-x-1 bottom-1 z-10 flex flex-col gap-1">
                      <div className="flex gap-1">
                        {(
                          [
                            ["PRODUCT", "Product"],
                            ["ON_MODEL", "On model"],
                            ["DETAIL", "Detail"],
                          ] as const
                        ).map(([role, label]) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              const next = currentImages.map((row, i) =>
                                i === index ? { ...row, role } : row,
                              );
                              commitMedia(next);
                            }}
                            className={cn(
                              "flex-1 rounded px-1 py-1 text-[9px] font-medium transition",
                              (item.role || "PRODUCT") === role
                                ? "bg-[#8b2e2e] text-white"
                                : "bg-black/55 text-white/90 hover:bg-black/75",
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {isThumb ? (
                        <div className="flex items-center justify-center gap-1 rounded bg-[#8b2e2e] px-2 py-1 text-[10px] font-medium text-white">
                          <Check className="size-3" />
                          Thumbnail
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setValue("thumbnail", item.url, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          className="rounded bg-black/70 px-2 py-1.5 text-[11px] font-medium text-white opacity-90 transition hover:bg-black/85"
                        >
                          Set as thumbnail
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => photoInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-[#faf8f6] px-6 py-12 text-center transition hover:border-[#8b2e2e]/40"
          >
            <Upload className="size-8 text-[#8b2e2e]" />
            <div>
              <p className="font-medium text-neutral-900">
                Upload product photos
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Then optionally add a video · drag to reorder
              </p>
            </div>
          </button>
        )}

        {(error || errors.images || errors.thumbnail || errors.videoUrl) && (
          <p className="mt-2 text-sm text-destructive">
            {error ||
              errors.images?.message ||
              errors.thumbnail?.message ||
              errors.videoUrl?.message}
          </p>
        )}
        {busy && (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Uploading media…
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">Media guidelines</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Drag cards by the grip handle to set gallery sequence</li>
          <li>• Crop photos & video; drag watermark, then Save</li>
          <li>• Edit again: open pencil → turn watermark off to remove logo</li>
          <li>• Storefront video autoplays muted with no controls</li>
          <li>• Keep videos short (under ~40s) for smooth crop export</li>
        </ul>
      </div>

      <ProductImageEditor
        open={Boolean(imageEditor)}
        imageSrc={imageEditor?.src ?? null}
        title={
          imageEditor?.replaceUrl
            ? "Edit product photo"
            : imageEditor?.queue?.length
              ? `Edit photo · ${imageEditor.queue.length} more in queue`
              : "Edit product photo"
        }
        onOpenChange={(open) => {
          if (!open) closeImageEditor();
        }}
        onApply={handleImageApply}
      />

      <ProductVideoEditor
        open={Boolean(videoEditor)}
        videoSrc={videoEditor?.src ?? null}
        title={
          videoEditor?.replaceUrl ? "Edit product video" : "Edit product video"
        }
        onOpenChange={(open) => {
          if (!open) closeVideoEditor();
        }}
        onApply={handleVideoApply}
      />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Film, Loader2, X } from "lucide-react";
import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadProductVideo } from "@/actions/seller/upload-product-video";

type ImagesStepProps = {
  watch: any;
  setValue: any;
  errors: any;
};

export function ImagesStep({ watch, setValue, errors }: ImagesStepProps) {
  const currentImages = watch("images") || [];
  const thumbnail = watch("thumbnail") || "";
  const videoUrl = watch("videoUrl") || "";
  const productName = watch("name") || "Product image";
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const syncImages = (urls: string[], nextThumbnail?: string) => {
    const images = urls.map((url, index) => ({
      url,
      altText: productName,
      sortOrder: index,
    }));
    setValue("images", images, { shouldValidate: true, shouldDirty: true });

    let thumb = nextThumbnail ?? thumbnail;
    if (thumb && !urls.includes(thumb)) {
      thumb = urls[0] || "";
    }
    if (!thumb && urls[0]) {
      thumb = urls[0];
    }
    if (!urls.length) {
      thumb = "";
    }
    setValue("thumbnail", thumb, { shouldValidate: true, shouldDirty: true });
  };

  const handleImagesChange = (urls: string[]) => {
    const keepCurrent = thumbnail && urls.includes(thumbnail);
    syncImages(urls, keepCurrent ? thumbnail : urls[0] || "");
  };

  const handleThumbnailChange = (url: string) => {
    if (!url) {
      setValue("thumbnail", "", { shouldValidate: true, shouldDirty: true });
      return;
    }
    setValue("thumbnail", url, { shouldValidate: true, shouldDirty: true });
  };

  const handleVideoFile = async (file: File | null) => {
    if (!file) return;
    setVideoError(null);
    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProductVideo(formData);
      if (!result.success) {
        throw new Error(result.error || "Video upload failed");
      }
      setValue("videoUrl", result.data.url, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Video upload failed");
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const clearVideo = () => {
    setValue("videoUrl", undefined, { shouldValidate: true, shouldDirty: true });
    setVideoError(null);
  };

  const imageUrls = currentImages.map((img: any) => img.url);

  return (
    <div className="space-y-8">
      <div>
        <Label>Product Images *</Label>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload up to 5 photos. Each opens an editor to crop, zoom, and add the
          VIDYORA logo. Hover a saved image to edit again or{" "}
          <span className="font-medium text-neutral-700">Set as thumbnail</span>.
        </p>
        <ImageUpload
          value={imageUrls}
          onChange={handleImagesChange}
          thumbnailUrl={thumbnail}
          onThumbnailChange={handleThumbnailChange}
          maxFiles={5}
          maxSize={5}
        />
        {errors.images && (
          <p className="mt-2 text-sm text-destructive">{errors.images.message}</p>
        )}
        {errors.thumbnail && (
          <p className="mt-2 text-sm text-destructive">{errors.thumbnail.message}</p>
        )}
      </div>

      <div>
        <Label>Product video (optional)</Label>
        <p className="mb-4 text-sm text-muted-foreground">
          Add one short product video (MP4 / WEBM / MOV, up to 40MB). Shown in the
          product gallery on the storefront.
        </p>

        {videoUrl ? (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950">
            <div className="relative aspect-video">
              <video
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                className="size-full object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-3 top-3 size-8"
                onClick={clearVideo}
                aria-label="Remove video"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
              <p className="truncate text-xs text-muted-foreground">{videoUrl}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingVideo}
                onClick={() => videoInputRef.current?.click()}
              >
                Replace
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploadingVideo}
            onClick={() => videoInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-[#faf8f6] px-6 py-10 text-center transition hover:border-[#8b2e2e]/40 hover:bg-[#f6ebe8] disabled:opacity-60"
          >
            {isUploadingVideo ? (
              <Loader2 className="size-8 animate-spin text-[#8b2e2e]" />
            ) : (
              <Film className="size-8 text-[#8b2e2e]" />
            )}
            <div>
              <p className="font-medium text-neutral-900">
                {isUploadingVideo ? "Uploading video…" : "Upload product video"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                MP4, WEBM or MOV · max 40MB
              </p>
            </div>
          </button>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => handleVideoFile(e.target.files?.[0] || null)}
        />

        {videoError && (
          <p className="mt-2 text-sm text-destructive">{videoError}</p>
        )}
        {errors.videoUrl && (
          <p className="mt-2 text-sm text-destructive">{errors.videoUrl.message}</p>
        )}
      </div>

      <div className="rounded-xl border bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">Media guidelines</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Crop and zoom photos before upload; add logo if you want</li>
          <li>• Click the pencil on any image to re-edit (add or edit product)</li>
          <li>• Optional video helps customers see craftsmanship and fit</li>
          <li>• Keep videos short and steady; avoid heavy music overlays</li>
          <li>• Click “Set as thumbnail” on the photo you want as main</li>
        </ul>
      </div>
    </div>
  );
}

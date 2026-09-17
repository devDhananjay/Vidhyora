import { ImageUpload } from "@/components/shared/image-upload";
import { Label } from "@/components/ui/label";

type ImagesStepProps = {
  watch: any;
  setValue: any;
  errors: any;
};

export function ImagesStep({ watch, setValue, errors }: ImagesStepProps) {
  const currentImages = watch("images") || [];
  const thumbnail = watch("thumbnail") || "";
  const productName = watch("name") || "Product image";

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

  const imageUrls = currentImages.map((img: any) => img.url);

  return (
    <div className="space-y-6">
      <div>
        <Label>Product Images *</Label>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload up to 5 high-quality images. Hover an image and click{" "}
          <span className="font-medium text-neutral-700">Set as thumbnail</span>{" "}
          to choose the main photo (first image is default).
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

      <div className="rounded-xl border bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">Image Guidelines</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Use high-resolution images (at least 1000x1000px)</li>
          <li>• Use white or neutral backgrounds</li>
          <li>• Show product from multiple angles</li>
          <li>• Click “Set as thumbnail” on the photo you want as main</li>
          <li>• Avoid watermarks or text overlays</li>
        </ul>
      </div>
    </div>
  );
}

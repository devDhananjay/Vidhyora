import { ImageUpload } from "@/components/shared/image-upload";
import { Label } from "@/components/ui/label";

type ImagesStepProps = {
  watch: any;
  setValue: any;
  errors: any;
};

export function ImagesStep({ watch, setValue, errors }: ImagesStepProps) {
  const currentImages = watch("images") || [];

  const handleImagesChange = (urls: string[]) => {
    if (urls.length > 0) {
      setValue("thumbnail", urls[0], { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("thumbnail", "", { shouldValidate: true, shouldDirty: true });
    }

    const images = urls.map((url, index) => ({
      url,
      altText: watch("name") || "Product image",
      sortOrder: index,
    }));

    setValue("images", images, { shouldValidate: true, shouldDirty: true });
  };

  const imageUrls = currentImages.map((img: any) => img.url);

  return (
    <div className="space-y-6">
      <div>
        <Label>Product Images *</Label>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload up to 5 high-quality images. The first image will be used as the thumbnail.
        </p>
        <ImageUpload
          value={imageUrls}
          onChange={handleImagesChange}
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

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">Image Guidelines</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Use high-resolution images (at least 1000x1000px)</li>
          <li>• Use white or neutral backgrounds</li>
          <li>• Show product from multiple angles</li>
          <li>• Include close-ups of important features</li>
          <li>• Avoid watermarks or text overlays</li>
        </ul>
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BasicInfoStepProps = {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  categories: any[];
};

export function BasicInfoStep({
  register,
  errors,
  watch,
  setValue,
  categories,
}: BasicInfoStepProps) {
  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug);
  };

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          {...register("name")}
          onChange={handleNameChange}
          placeholder="Apple iPhone 15 Pro Max"
          className="mt-2"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          {...register("slug")}
          placeholder="apple-iphone-15-pro-max"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Auto-generated from product name. Use lowercase and hyphens only.
        </p>
        {errors.slug && (
          <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      {/* Brand */}
      <div>
        <Label htmlFor="brand">Brand *</Label>
        <Input
          id="brand"
          {...register("brand")}
          placeholder="Apple"
          className="mt-2"
        />
        {errors.brand && (
          <p className="mt-1 text-sm text-destructive">{errors.brand.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="categoryId">Category *</Label>
        <Select
          onValueChange={(value) => setValue("categoryId", value)}
          defaultValue={watch("categoryId")}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Short Description */}
      <div>
        <Label htmlFor="shortDescription">Short Description *</Label>
        <Textarea
          id="shortDescription"
          {...register("shortDescription")}
          placeholder="Brief one-liner about your product"
          rows={2}
          className="mt-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {watch("shortDescription")?.length || 0} / 500 characters
        </p>
        {errors.shortDescription && (
          <p className="mt-1 text-sm text-destructive">{errors.shortDescription.message}</p>
        )}
      </div>

      {/* Full Description */}
      <div>
        <Label htmlFor="description">Full Description *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Detailed product description, features, specifications..."
          rows={8}
          className="mt-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Minimum 50 characters. Include features, specifications, and benefits.
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
    </div>
  );
}

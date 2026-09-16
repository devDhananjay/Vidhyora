import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JewelleryLineIcon } from "@/components/storefront/jewellery-icons";

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
  const categoryId = watch("categoryId");
  const productAttributes = (watch("attributes") || {}) as Record<string, string>;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categoryAttributes = (selectedCategory?.attributes ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    options: unknown;
    isRequired: boolean;
  }>;

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

  const setAttributeValue = (slug: string, value: string) => {
    setValue("attributes", { ...productAttributes, [slug]: value });
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
          onValueChange={(value) =>
            setValue("categoryId", value, { shouldValidate: true, shouldDirty: true })
          }
          value={categoryId || undefined}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="inline-flex items-center gap-2">
                  <JewelleryLineIcon
                    label={category.name}
                    className="size-4 shrink-0 text-[#6b3f32]"
                  />
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      {categoryAttributes.length > 0 ? (
        <div className="space-y-4 rounded-2xl border border-neutral-100 bg-[#faf8f6] p-4">
          <p className="text-sm font-medium text-neutral-900">
            Category attributes
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {categoryAttributes.map((attr) => {
              const options = Array.isArray(attr.options)
                ? attr.options.map(String)
                : [];
              return (
                <div key={attr.id} className="space-y-2">
                  <Label htmlFor={`attr-${attr.slug}`}>
                    {attr.name}
                    {attr.isRequired ? " *" : ""}
                  </Label>
                  {attr.type === "select" ? (
                    <NativeSelect
                      id={`attr-${attr.slug}`}
                      value={productAttributes[attr.slug] || ""}
                      onChange={(e) =>
                        setAttributeValue(attr.slug, e.target.value)
                      }
                    >
                      <option value="">Select…</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </NativeSelect>
                  ) : attr.type === "boolean" ? (
                    <NativeSelect
                      id={`attr-${attr.slug}`}
                      value={productAttributes[attr.slug] || ""}
                      onChange={(e) =>
                        setAttributeValue(attr.slug, e.target.value)
                      }
                    >
                      <option value="">Select…</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </NativeSelect>
                  ) : (
                    <Input
                      id={`attr-${attr.slug}`}
                      type={attr.type === "number" ? "number" : "text"}
                      className="rounded-full"
                      value={productAttributes[attr.slug] || ""}
                      onChange={(e) =>
                        setAttributeValue(attr.slug, e.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

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

import type { ChangeEvent } from "react";
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

  // Auto-generate slug from name (keep RHF register onChange)
  const nameRegister = register("name");
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    nameRegister.onChange(e);
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug, { shouldDirty: true });
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
          {...nameRegister}
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

      {/* Metal details — shown on storefront Jewellery Details */}
      <div className="space-y-4 rounded-2xl border border-neutral-100 bg-[#faf8f6] p-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">Metal details</p>
          <p className="mt-1 text-xs text-muted-foreground">
            These show under Metal Details on the product page (Karatage,
            colour, weight, metal).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="attr-metal">Metal</Label>
            <NativeSelect
              id="attr-metal"
              value={productAttributes.metal || ""}
              onChange={(e) => setAttributeValue("metal", e.target.value)}
            >
              <option value="">Select metal…</option>
              <option value="Gold Finish">Gold Finish</option>
              <option value="Yellow Gold Finish">Yellow Gold Finish</option>
              <option value="White Gold Finish">White Gold Finish</option>
              <option value="Rose Gold Finish">Rose Gold Finish</option>
              <option value="Silver Finish">Silver Finish</option>
              <option value="Platinum Finish">Platinum Finish</option>
              <option value="Diamond Finish">Diamond Finish</option>
              <option value="Oxidised Finish">Oxidised Finish</option>
              <option value="Other Finish">Other Finish</option>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attr-karatage">Karatage</Label>
            <NativeSelect
              id="attr-karatage"
              value={productAttributes.karatage || productAttributes.purity || ""}
              onChange={(e) => {
                setAttributeValue("karatage", e.target.value);
                setAttributeValue("purity", e.target.value);
              }}
            >
              <option value="">Select karatage…</option>
              <option value="24K">24K</option>
              <option value="22K">22K</option>
              <option value="18K">18K</option>
              <option value="14K">14K</option>
              <option value="9K">9K</option>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attr-colour">Material colour</Label>
            <NativeSelect
              id="attr-colour"
              value={
                productAttributes.colour ||
                productAttributes.materialColour ||
                ""
              }
              onChange={(e) => {
                setAttributeValue("colour", e.target.value);
                setAttributeValue("materialColour", e.target.value);
              }}
            >
              <option value="">Select colour…</option>
              <option value="Yellow">Yellow</option>
              <option value="White">White</option>
              <option value="Rose">Rose</option>
              <option value="Two Tone">Two Tone</option>
              <option value="Tri Color">Tri Color</option>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attr-weight">Gross weight</Label>
            <Input
              id="attr-weight"
              className="rounded-full"
              placeholder="e.g. 4.25g"
              value={
                productAttributes.weight || productAttributes.grossWeight || ""
              }
              onChange={(e) => {
                setAttributeValue("weight", e.target.value);
                setAttributeValue("grossWeight", e.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Include unit, e.g. 4.25g — used for price breakup too
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attr-stone">Stone (optional)</Label>
            <Input
              id="attr-stone"
              className="rounded-full"
              placeholder="e.g. Diamond, CZ, None"
              value={productAttributes.stone || ""}
              onChange={(e) => setAttributeValue("stone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attr-finish">Finish (optional)</Label>
            <Input
              id="attr-finish"
              className="rounded-full"
              placeholder="e.g. Polished, Matte"
              value={productAttributes.finish || ""}
              onChange={(e) => setAttributeValue("finish", e.target.value)}
            />
          </div>
        </div>
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

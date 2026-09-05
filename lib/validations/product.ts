import { z } from "zod";

/** Empty inputs + NaN from valueAsNumber → undefined so optional fields don't block submit */
function emptyToUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isNaN(value)) return undefined;
  return value;
}

const requiredNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ invalid_type_error: "Enter a valid number" }).min(0),
);

const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).optional(),
);

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional(),
);

export const productBasicInfoSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  brand: z.string().min(2, "Brand must be at least 2 characters").max(100),
  categoryId: z.string().min(1, "Category is required"),
  shortDescription: z
    .string()
    .min(20, "Short description must be at least 20 characters")
    .max(500),
  description: z.string().min(50, "Description must be at least 50 characters"),
});

export const productVariantSchema = z.object({
  sku: z.string().min(3, "SKU must be at least 3 characters").max(50),
  attributes: z.record(z.string()).optional().default({}),
  price: requiredNumber,
  compareAtPrice: optionalNumber,
  stock: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0, "Stock must be 0 or more"),
  ),
  weight: optionalNumber,
  dimensions: z.record(z.number()).optional(),
  isActive: z.boolean().default(true),
});

export const productPolicySchema = z.object({
  returnAllowed: z.boolean().default(false),
  returnWindowDays: optionalInt,
  replacementAllowed: z.boolean().default(false),
  replacementWindowDays: optionalInt,
  warrantyAvailable: z.boolean().default(false),
  warrantyMonths: optionalInt,
  policyDescription: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  brand: z.string().min(2).max(100),
  categoryId: z.string().min(1, "Category is required"),
  shortDescription: z.string().min(20).max(500),
  description: z.string().min(50),

  thumbnail: z
    .string({ required_error: "Add at least one product image" })
    .min(1, "Add at least one product image")
    .refine(
      (value) =>
        value.startsWith("/uploads/") ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:image/"),
      "Add at least one product image",
    ),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        altText: z.string().optional(),
        sortOrder: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Add at least one product image"),

  variants: z
    .array(productVariantSchema)
    .min(1, "Add at least one variant"),

  policy: productPolicySchema.default({
    returnAllowed: false,
    replacementAllowed: false,
    warrantyAvailable: false,
  }),

  basePrice: requiredNumber,
  compareAtPrice: optionalNumber,
  tax: z.coerce.number().min(0).max(100).catch(0).default(0),
});

export type ProductBasicInfoInput = z.infer<typeof productBasicInfoSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductPolicyInput = z.infer<typeof productPolicySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;

export function normalizeProductFormValues(product: any): CreateProductInput {
  const images = (product.images ?? []).map(
    (image: { url: string; altText?: string | null; sortOrder?: number }, index: number) => ({
      url: image.url,
      altText: image.altText || undefined,
      sortOrder: image.sortOrder ?? index,
    }),
  );

  const variants = (product.variants ?? []).map(
    (variant: {
      sku: string;
      attributes?: unknown;
      price: unknown;
      compareAtPrice?: unknown;
      stock: unknown;
      weight?: unknown;
      isActive?: boolean;
    }) => ({
      sku: variant.sku,
      attributes:
        variant.attributes &&
        typeof variant.attributes === "object" &&
        !Array.isArray(variant.attributes)
          ? Object.fromEntries(
              Object.entries(variant.attributes as Record<string, unknown>).map(
                ([key, value]) => [key, String(value ?? "")],
              ),
            )
          : {},
      price: Number(variant.price) || 0,
      compareAtPrice:
        variant.compareAtPrice == null || variant.compareAtPrice === ""
          ? undefined
          : Number(variant.compareAtPrice),
      stock: Number(variant.stock) || 0,
      weight:
        variant.weight == null || variant.weight === ""
          ? undefined
          : Number(variant.weight),
      isActive: variant.isActive ?? true,
    }),
  );

  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    brand: product.brand ?? "",
    categoryId: product.categoryId ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    thumbnail: product.thumbnail || images[0]?.url || "",
    images,
    variants:
      variants.length > 0
        ? variants
        : [
            {
              sku: "",
              attributes: {},
              price: Number(product.basePrice) || 0,
              stock: 0,
              isActive: true,
            },
          ],
    policy: {
      returnAllowed: product.policy?.returnAllowed ?? false,
      returnWindowDays: product.policy?.returnWindowDays ?? undefined,
      replacementAllowed: product.policy?.replacementAllowed ?? false,
      replacementWindowDays: product.policy?.replacementWindowDays ?? undefined,
      warrantyAvailable: product.policy?.warrantyAvailable ?? false,
      warrantyMonths: product.policy?.warrantyMonths ?? undefined,
      policyDescription: product.policy?.policyDescription ?? undefined,
    },
    basePrice: Number(product.basePrice) || 0,
    compareAtPrice:
      product.compareAtPrice == null
        ? undefined
        : Number(product.compareAtPrice),
    tax: Number(product.tax) || 0,
  };
}

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
        sourceUrl: z.string().optional(),
        altText: z.string().optional(),
        kind: z.enum(["IMAGE", "VIDEO"]).optional().default("IMAGE"),
        role: z
          .enum(["PRODUCT", "ON_MODEL", "DETAIL"])
          .optional()
          .default("PRODUCT"),
        sortOrder: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Add at least one product image")
    .superRefine((items, ctx) => {
      const photos = items.filter((i) => (i.kind || "IMAGE") === "IMAGE");
      const videos = items.filter((i) => i.kind === "VIDEO");
      if (photos.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one product photo",
        });
      }
      if (videos.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Only one product video is allowed",
        });
      }
    }),

  videoUrl: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return value;
    },
    z
      .string()
      .refine(
        (value) =>
          value.startsWith("/uploads/") ||
          value.startsWith("http://") ||
          value.startsWith("https://"),
        "Upload a valid product video",
      )
      .refine(
        (value) =>
          /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(value) ||
          value.includes("/videos/"),
        "Video must be MP4, WEBM, or MOV",
      )
      .optional(),
  ),

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
  tax: z.coerce.number().min(0).max(100).catch(3).default(3),
  hsn: z.string().trim().max(16).optional().default(""),
  certificateNumber: z.string().trim().max(64).optional().default(""),
  certificateUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default("")
    .refine(
      (value) =>
        !value ||
        /^https?:\/\//i.test(value) ||
        value.startsWith("/uploads/"),
      "Certificate file must be an uploaded URL",
    ),
  attributes: z.record(z.string()).optional().default({}),
});

export type ProductBasicInfoInput = z.infer<typeof productBasicInfoSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductPolicyInput = z.infer<typeof productPolicySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;

export function normalizeProductFormValues(product: any): CreateProductInput {
  type MediaRow = {
    url: string;
    sourceUrl?: string;
    altText?: string;
    kind: "IMAGE" | "VIDEO";
    role: "PRODUCT" | "ON_MODEL" | "DETAIL";
    sortOrder: number;
  };

  const rawImages: MediaRow[] = (product.images ?? []).map(
    (
      image: {
        url: string;
        sourceUrl?: string | null;
        altText?: string | null;
        kind?: string | null;
        role?: string | null;
        sortOrder?: number;
      },
      index: number,
    ) => ({
      url: image.url,
      sourceUrl: image.sourceUrl || image.url,
      altText: image.altText || undefined,
      kind: image.kind === "VIDEO" ? "VIDEO" : "IMAGE",
      role:
        image.role === "ON_MODEL" || image.role === "DETAIL"
          ? image.role
          : "PRODUCT",
      sortOrder: image.sortOrder ?? index,
    }),
  );

  const hasVideoItem = rawImages.some((i) => i.kind === "VIDEO");
  const images: MediaRow[] =
    product.videoUrl && !hasVideoItem
      ? [
          {
            url: product.videoUrl as string,
            sourceUrl: product.videoUrl as string,
            altText: undefined,
            kind: "VIDEO",
            role: "PRODUCT",
            sortOrder: 0,
          },
          ...rawImages.map((img, index) => ({
            ...img,
            sortOrder: index + 1,
          })),
        ]
      : rawImages
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img, index) => ({ ...img, sortOrder: index }));

  const firstPhoto = images.find((i) => i.kind === "IMAGE");
  const videoItem = images.find((i) => i.kind === "VIDEO");

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
    thumbnail:
      (product.thumbnail &&
      firstPhoto &&
      images.some((i) => i.url === product.thumbnail && i.kind === "IMAGE")
        ? product.thumbnail
        : firstPhoto?.url) || "",
    images,
    videoUrl: videoItem?.url || product.videoUrl || undefined,
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
    tax: Number(product.tax) || 3,
    hsn: product.hsn || "",
    certificateNumber: product.certificateNumber || "",
    certificateUrl: product.certificateUrl || "",
    attributes: {
      metal: "",
      size: "Free Size",
      karatage: "",
      purity: "",
      quality: "",
      colour: "",
      materialColour: "",
      weight: "",
      grossWeight: "",
      stone: "",
      finish: "",
      makingChargePercent: "",
      metalRatePerGram: "",
      ...(product.attributes &&
      typeof product.attributes === "object" &&
      !Array.isArray(product.attributes)
        ? Object.fromEntries(
            Object.entries(product.attributes as Record<string, unknown>).map(
              ([key, value]) => [key, String(value ?? "")],
            ),
          )
        : {}),
    },
  };
}

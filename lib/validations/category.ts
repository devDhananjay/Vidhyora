import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  });

const imageUrlSchema = z
  .string()
  .refine(
    (value) =>
      value.startsWith("/uploads/") ||
      value.startsWith("/brand/") ||
      z.string().url().safeParse(value).success,
    "Invalid image URL",
  );

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: optionalText.refine(
    (value) => value === undefined || value.length >= 10,
    "Description must be at least 10 characters",
  ),
  image: optionalText.refine(
    (value) => value === undefined || imageUrlSchema.safeParse(value).success,
    "Invalid image URL",
  ),
  parentId: z
    .string()
    .optional()
    .nullable()
    .transform((value) => {
      if (value == null || value === "" || value === "none") return null;
      return value;
    }),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  commissionPercentage: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === undefined || value === null) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    })
    .refine(
      (value) => value === null || (value >= 0 && value <= 100),
      "Commission must be between 0 and 100",
    ),
});

export const categoryAttributeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  type: z.enum(["text", "number", "select", "boolean"]).default("text"),
  options: z.array(z.string().min(1)).optional(),
  isRequired: z.boolean().default(false),
  isFilterable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export type CategoryInput = z.output<typeof categorySchema>;
export type CategoryFormValues = z.input<typeof categorySchema>;
export type CategoryAttributeInput = z.infer<typeof categoryAttributeSchema>;

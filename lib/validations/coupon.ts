import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isNaN(value)) return undefined;
  return value;
}

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(50)
      .transform((value) => value.toUpperCase())
      .refine((value) => /^[A-Z0-9-]+$/.test(value), {
        message: "Code must contain only uppercase letters, numbers, and hyphens",
      }),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.coerce.number().min(0, "Discount value must be positive"),
    minimumOrderValue: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(0).optional(),
    ),
    maximumDiscount: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(0).optional(),
    ),
    startDate: z.string().min(1, "Start date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    usageLimit: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).optional(),
    ),
    perUserLimit: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).optional(),
    ),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.expiryDate) return true;
      return new Date(data.expiryDate) >= new Date(data.startDate);
    },
    {
      message: "Expiry date must be on or after start date",
      path: ["expiryDate"],
    },
  );

export type CouponInput = z.infer<typeof couponSchema>;

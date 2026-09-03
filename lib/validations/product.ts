import { z } from "zod";

export const productBasicInfoSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  brand: z.string().min(2, "Brand must be at least 2 characters").max(100),
  categoryId: z.string().min(1, "Category is required"),
  shortDescription: z.string().min(20, "Short description must be at least 20 characters").max(500),
  description: z.string().min(50, "Description must be at least 50 characters"),
});

export const productVariantSchema = z.object({
  sku: z.string().min(3, "SKU must be at least 3 characters").max(50),
  attributes: z.record(z.string()).default({}),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, "Stock must be 0 or more"),
  weight: z.number().min(0).optional(),
  dimensions: z.record(z.number()).optional(),
  isActive: z.boolean().default(true),
});

export const productPolicySchema = z.object({
  returnAllowed: z.boolean().default(false),
  returnWindowDays: z.number().int().min(0).optional(),
  replacementAllowed: z.boolean().default(false),
  replacementWindowDays: z.number().int().min(0).optional(),
  warrantyAvailable: z.boolean().default(false),
  warrantyMonths: z.number().int().min(0).optional(),
  policyDescription: z.string().optional(),
});

export const createProductSchema = z.object({
  // Basic Info
  name: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
  brand: z.string().min(2).max(100),
  categoryId: z.string().min(1),
  shortDescription: z.string().min(20).max(500),
  description: z.string().min(50),
  
  // Images
  thumbnail: z.string().url("Invalid thumbnail URL"),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    sortOrder: z.number().int().min(0),
  })).min(1, "At least one image is required"),
  
  // Variants
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
  
  // Policy
  policy: productPolicySchema,
  
  // Pricing (base price from first variant)
  basePrice: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  tax: z.number().min(0).max(100).default(0),
});

export type ProductBasicInfoInput = z.infer<typeof productBasicInfoSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductPolicyInput = z.infer<typeof productPolicySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;

import { z } from "zod";

export const aiProductDraftSchema = z.object({
  name: z.string().min(3).max(160),
  brand: z.string().min(2).max(80).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  categoryName: z.string().optional().nullable(),
  shortDescription: z.string().min(20).max(500),
  description: z.string().min(50).max(5000),
  suggestedPrice: z.number().min(0).optional().nullable(),
  compareAtPrice: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0).optional().nullable(),
  sku: z.string().min(3).max(50).optional().nullable(),
  variantLabel: z.string().max(80).optional().nullable(),
  makingChargePercent: z.string().max(20).optional().nullable(),
  metalRatePerGram: z.string().max(40).optional().nullable(),
  hsn: z.string().max(20).optional().nullable(),
  certificateNumber: z.string().max(80).optional().nullable(),
  imageAltText: z.string().max(160).optional().nullable(),
  attributes: z.record(z.string()).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  questions: z.array(z.string()).max(6).optional().nullable(),
});

export type AiProductDraft = z.infer<typeof aiProductDraftSchema>;

export const aiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

export const analyzeProductImageInputSchema = z.object({
  imageUrl: z.string().min(1).optional(),
  imageUrls: z.array(z.string().min(1)).min(1).max(3).optional(),
  categories: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string().optional(),
      }),
    )
    .max(80),
}).refine(
  (v) => Boolean(v.imageUrl) || (v.imageUrls && v.imageUrls.length > 0),
  { message: "At least one image is required" },
);

export const refineProductDraftInputSchema = z.object({
  imageUrl: z.string().min(1).optional(),
  imageUrls: z.array(z.string().min(1)).max(3).optional(),
  draft: aiProductDraftSchema,
  messages: z.array(aiChatMessageSchema).max(24),
  userMessage: z.string().min(1).max(2000),
  categories: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string().optional(),
      }),
    )
    .max(80),
});

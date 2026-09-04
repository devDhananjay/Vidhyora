import { z } from "zod";

export const HELP_CATEGORIES = [
  "Orders",
  "Payments",
  "Returns",
  "Jewellery Care",
  "Stores",
  "Account",
] as const;

export const storeLocationSchema = z.object({
  name: z.string().min(2, "Store name is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  address: z.string().min(8, "Address is required"),
  postalCode: z.string().optional(),
  phone: z.string().min(8, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  hours: z.string().min(4, "Hours are required"),
  mapUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const helpArticleSchema = z.object({
  category: z.enum(HELP_CATEGORIES),
  question: z.string().min(8, "Question is required"),
  answer: z.string().min(12, "Answer is required"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type StoreLocationInput = z.infer<typeof storeLocationSchema>;
export type HelpArticleInput = z.infer<typeof helpArticleSchema>;

import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500).optional(),
  image: z.string().url("Invalid image URL").optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const categoryAttributeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(100),
  dataType: z.enum(["STRING", "NUMBER", "BOOLEAN", "SELECT"]),
  isRequired: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
  selectOptions: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryAttributeInput = z.infer<typeof categoryAttributeSchema>;

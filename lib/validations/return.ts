import { z } from "zod";

export const returnRequestSchema = z.object({
  orderItemId: z.string().min(1, "Order item is required"),
  type: z.enum(["RETURN", "REPLACEMENT"]),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
});

export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;

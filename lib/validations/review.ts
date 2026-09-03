import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  orderItemId: z.string().min(1, "Order item ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be at most 100 characters"),
  comment: z.string().min(20, "Review must be at least 20 characters").max(1000, "Review must be at most 1000 characters"),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
});

export const updateReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(5).max(100),
  comment: z.string().min(20).max(1000),
  images: z.array(z.string()).max(5).optional(),
});

export const markReviewHelpfulSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  helpful: z.boolean(),
});

export const moderateReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type MarkReviewHelpfulInput = z.infer<typeof markReviewHelpfulSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

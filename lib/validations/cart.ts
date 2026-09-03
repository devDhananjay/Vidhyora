import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const removeCartItemSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
});

export const saveForLaterSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  savedForLater: z.boolean(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
export type SaveForLaterInput = z.infer<typeof saveForLaterSchema>;

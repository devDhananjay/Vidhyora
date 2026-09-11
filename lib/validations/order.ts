import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1, "Delivery address is required"),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  hidePriceOnInvoice: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === true || value === "true"),
  giftMessage: z
    .string()
    .trim()
    .max(500, "Gift message must be 500 characters or less")
    .optional()
    .transform((value) => (value ? value : undefined)),
  occasionNote: z
    .string()
    .trim()
    .max(200, "Occasion note must be 200 characters or less")
    .optional()
    .transform((value) => (value ? value : undefined)),
  fastDelivery: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === true || value === "true"),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.enum([
    "ORDERED",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURN_APPROVED",
    "RETURNED",
    "REFUNDED",
  ]),
  note: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  reason: z.string().min(10, "Please provide a reason (min 10 characters)"),
});

export const createReturnRequestSchema = z.object({
  orderItemId: z.string().min(1, "Order item ID is required"),
  reason: z.string().min(10, "Please provide a reason (min 10 characters)"),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  type: z.enum(["RETURN", "REPLACEMENT"]),
});

export const sellerFulfillmentSchema = z
  .object({
    orderItemId: z.string().min(1, "Order item is required"),
    status: z.enum([
      "CONFIRMED",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]),
    trackingNumber: z.string().optional(),
    courier: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status !== "SHIPPED") return;
    if (!value.trackingNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trackingNumber"],
        message: "Tracking number is required when marking as shipped",
      });
    }
    if (!value.courier?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courier"],
        message: "Courier is required when marking as shipped",
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type SellerFulfillmentInput = z.infer<typeof sellerFulfillmentSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;

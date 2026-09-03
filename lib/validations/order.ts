import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1, "Delivery address is required"),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
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

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;

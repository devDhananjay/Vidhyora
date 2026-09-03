"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { cancelOrderSchema } from "@/lib/validations/order";
import { canCancelOrder } from "@/lib/orders/order-utils";
import type { ActionResult } from "@/lib/utils";

export async function cancelOrder(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const rawData = {
      orderId: formData.get("orderId"),
      reason: formData.get("reason"),
    };

    const validatedData = cancelOrderSchema.parse(rawData);

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: { items: true },
    });

    if (!order || order.userId !== session.user.id) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    if (!canCancelOrder(order.orderStatus)) {
      return {
        success: false,
        error: "Order cannot be cancelled at this stage",
      };
    }

    // Cancel order and release stock
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "CANCELLED",
        },
      });

      // Release reserved stock
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            reservedStock: { decrement: item.quantity },
          },
        });
      }

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CANCELLED",
          actorId: session.user.id,
          note: validatedData.reason,
        },
      });

      // If payment was made, create refund record
      if (order.paymentStatus === "PAID") {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: "REFUNDED" },
        });
      }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${order.id}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Cancel order error:", error);
    return {
      success: false,
      error: "Failed to cancel order",
    };
  }
}

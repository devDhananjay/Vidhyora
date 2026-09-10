"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { canCancelOrder } from "@/lib/orders/order-utils";
import type { ActionResult } from "@/lib/utils";

export async function adminCancelOrder(
  orderId: string,
  note?: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    if (!order) {
      return { success: false, error: "Order not found" };
    }
    if (!canCancelOrder(order.orderStatus)) {
      return {
        success: false,
        error: "This order can no longer be cancelled",
      };
    }

    await prisma.$transaction(async (tx) => {
      if (
        order.paymentStatus === "PAID" ||
        order.orderStatus === "CONFIRMED" ||
        order.orderStatus === "PACKED"
      ) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "CANCELLED" as OrderStatus,
          ...(order.paymentStatus === "PENDING"
            ? { paymentStatus: "FAILED" as const }
            : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "CANCELLED",
          actorId: session.user.id,
          note: note?.trim() || "Cancelled by platform admin",
        },
      });
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/seller/orders");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("adminCancelOrder error:", error);
    return { success: false, error: "Failed to cancel order" };
  }
}

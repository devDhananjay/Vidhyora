"use server";

import type { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { getNextFulfillmentStep } from "@/lib/orders/order-utils";
import { updateSellerOrderFulfillment } from "@/actions/seller/manage-orders";
import type { ActionResult } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * Bulk-advance orders that share the same next fulfillment step.
 * SHIPPED is skipped here (needs tracking) — use packing slip / single ship.
 */
export async function bulkAdvanceFulfillment(
  orderItemIds: string[],
  targetStatus: OrderStatus,
): Promise<ActionResult<{ updated: number; failed: string[] }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }

    if (targetStatus === "SHIPPED") {
      return {
        success: false,
        error: "Bulk ship needs tracking — use packing slips and ship one-by-one, or confirm/pack in bulk.",
      };
    }

    const uniqueIds = [...new Set(orderItemIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return { success: false, error: "No orders selected" };
    }

    const items = await prisma.orderItem.findMany({
      where: {
        id: { in: uniqueIds },
        sellerId: acting.sellerUserId,
      },
      include: { order: { select: { orderStatus: true, orderNumber: true } } },
    });

    let updated = 0;
    const failed: string[] = [];

    for (const item of items) {
      const next = getNextFulfillmentStep(item.order.orderStatus);
      if (!next || next.nextStatus !== targetStatus) {
        failed.push(item.order.orderNumber);
        continue;
      }
      const result = await updateSellerOrderFulfillment({
        orderItemId: item.id,
        status: targetStatus,
      });
      if (result.success) updated += 1;
      else failed.push(item.order.orderNumber);
    }

    revalidatePath("/seller/orders");
    return { success: true, data: { updated, failed } };
  } catch (error) {
    console.error("Bulk advance fulfillment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bulk update failed",
    };
  }
}

export async function getPackingSlipData(orderItemIds: string[]) {
  const acting = await getActingSeller();
  if (!acting) return [];

  const uniqueIds = [...new Set(orderItemIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const items = await prisma.orderItem.findMany({
    where: {
      id: { in: uniqueIds },
      sellerId: acting.sellerUserId,
    },
    include: {
      order: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      product: { select: { name: true, thumbnail: true } },
      variant: { select: { sku: true, attributes: true } },
    },
    orderBy: { order: { createdAt: "asc" } },
  });

  return items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    productName: item.productName,
    orderNumber: item.order.orderNumber,
    createdAt: item.order.createdAt,
    shippingAddress: item.order.shippingAddress as Record<string, string>,
    customerName: item.order.user.name,
    customerPhone: item.order.user.phone,
    sku: item.variant.sku,
    giftMessage: item.order.giftMessage,
  }));
}

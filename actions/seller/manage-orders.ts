"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { getNextFulfillmentStep } from "@/lib/orders/order-utils";
import {
  sellerFulfillmentSchema,
  type SellerFulfillmentInput,
} from "@/lib/validations/order";
import { recordEarningsForOrder } from "@/lib/payouts/record-earnings";
import type { ActionResult } from "@/lib/utils";

function revalidateOrderSurfaces(orderId: string, orderItemId: string) {
  revalidatePath("/seller");
  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderItemId}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateSellerOrderFulfillment(
  input: SellerFulfillmentInput,
): Promise<ActionResult<{ status: OrderStatus }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }

    const validated = sellerFulfillmentSchema.parse(input);

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: validated.orderItemId,
        sellerId: acting.sellerUserId,
      },
      include: {
        order: {
          include: {
            items: true,
            payments: true,
            shipments: true,
          },
        },
      },
    });

    if (!orderItem) {
      return { success: false, error: "Order not found" };
    }

    const next = getNextFulfillmentStep(orderItem.order.orderStatus);
    if (!next || next.nextStatus !== validated.status) {
      return {
        success: false,
        error: "This order cannot be moved to that status yet",
      };
    }

    const isCod = orderItem.order.payments.some(
      (payment) => payment.provider === "COD",
    );
    const trackingNumber = validated.trackingNumber?.trim() || null;
    const courier = validated.courier?.trim() || null;
    const note = validated.note?.trim() || next.label;

    await prisma.$transaction(async (tx) => {
      if (
        validated.status === "CONFIRMED" &&
        orderItem.order.paymentStatus === "PENDING"
      ) {
        for (const item of orderItem.order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
        }
      }

      const deliveredCod =
        validated.status === "DELIVERED" &&
        isCod &&
        orderItem.order.paymentStatus === "PENDING";

      await tx.order.update({
        where: { id: orderItem.orderId },
        data: {
          orderStatus: validated.status,
          ...(deliveredCod ? { paymentStatus: "PAID" as const } : {}),
        },
      });

      if (deliveredCod) {
        await tx.payment.updateMany({
          where: { orderId: orderItem.orderId, provider: "COD" },
          data: { status: "CAPTURED" },
        });
      }

      if (validated.status === "SHIPPED") {
        const existing = orderItem.order.shipments.find(
          (shipment) => shipment.sellerId === acting.sellerUserId,
        );
        if (existing) {
          await tx.shipment.update({
            where: { id: existing.id },
            data: {
              shippedAt: new Date(),
              trackingNumber: trackingNumber ?? existing.trackingNumber,
              courier: courier ?? existing.courier,
            },
          });
        } else {
          await tx.shipment.create({
            data: {
              orderId: orderItem.orderId,
              sellerId: acting.sellerUserId,
              trackingNumber,
              courier,
              shippedAt: new Date(),
            },
          });
        }
      }

      if (validated.status === "DELIVERED") {
        await tx.shipment.updateMany({
          where: {
            orderId: orderItem.orderId,
            sellerId: acting.sellerUserId,
          },
          data: { deliveredAt: new Date() },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: orderItem.orderId,
          status: validated.status,
          actorId: acting.session.user.id,
          note,
        },
      });
    });

    if (
      validated.status === "DELIVERED" &&
      isCod &&
      orderItem.order.paymentStatus === "PENDING"
    ) {
      try {
        await recordEarningsForOrder(orderItem.orderId);
      } catch (error) {
        console.error("Record seller earnings after COD delivery:", error);
      }
    }

    revalidateOrderSurfaces(orderItem.orderId, orderItem.id);

    return { success: true, data: { status: validated.status } };
  } catch (error) {
    console.error("Update seller order fulfillment error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

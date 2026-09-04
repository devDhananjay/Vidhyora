"use server";

import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { isSuperAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { reverseEarningForOrderItem } from "@/lib/payouts/record-earnings";
import {
  refundRazorpayIfNeeded,
  remainingPaidItemCount,
} from "@/lib/payouts/refund-return";

const RETURN_INCLUDE = {
  user: {
    select: { name: true, email: true },
  },
  orderItem: {
    include: {
      product: {
        select: {
          name: true,
          thumbnail: true,
          seller: {
            select: { businessName: true, sellerId: true },
          },
        },
      },
      order: {
        select: { id: true, orderNumber: true },
      },
    },
  },
} as const;

export async function getAllReturnRequests() {
  try {
    await requireAdmin();

    return prisma.returnRequest.findMany({
      include: RETURN_INCLUDE,
      orderBy: { requestedAt: "desc" },
    });
  } catch (error) {
    console.error("Get all return requests error:", error);
    return [];
  }
}

async function canModerate(requestSellerId: string) {
  const session = await requireAuth();
  if (isSuperAdmin(session.user.role)) {
    return { ok: true as const, session };
  }
  if (session.user.role === "SELLER" && session.user.id === requestSellerId) {
    return { ok: true as const, session };
  }
  return { ok: false as const, session };
}

export async function approveReturnRequest(
  id: string,
): Promise<ActionResult<void>> {
  try {
    const request = await prisma.returnRequest.findUnique({
      where: { id },
      include: { orderItem: true },
    });
    if (!request) {
      return { success: false, error: "Return request not found" };
    }

    const access = await canModerate(request.orderItem.sellerId);
    if (!access.ok) {
      return { success: false, error: "You cannot moderate this request" };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: "Only pending requests can be approved" };
    }

    await prisma.$transaction([
      prisma.returnRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          rejectedAt: null,
        },
      }),
      prisma.order.update({
        where: { id: request.orderItem.orderId },
        data: {
          orderStatus:
            request.type === "RETURN" ? "RETURN_APPROVED" : "RETURN_APPROVED",
        },
      }),
    ]);

    revalidatePath("/admin/returns");
    revalidatePath("/seller/returns");
    revalidatePath("/admin");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Approve return error:", error);
    return { success: false, error: "Failed to approve request" };
  }
}

export async function rejectReturnRequest(
  id: string,
  note: string,
): Promise<ActionResult<void>> {
  try {
    const reason = note.trim();
    if (!reason) {
      return { success: false, error: "Please provide a reason for rejection" };
    }

    const request = await prisma.returnRequest.findUnique({
      where: { id },
      include: { orderItem: true },
    });
    if (!request) {
      return { success: false, error: "Return request not found" };
    }

    const access = await canModerate(request.orderItem.sellerId);
    if (!access.ok) {
      return { success: false, error: "You cannot moderate this request" };
    }

    if (request.status !== "PENDING" && request.status !== "APPROVED") {
      return { success: false, error: "This request cannot be rejected" };
    }

    await prisma.returnRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        adminNote: reason,
      },
    });

    revalidatePath("/admin/returns");
    revalidatePath("/seller/returns");
    revalidatePath("/admin");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Reject return error:", error);
    return { success: false, error: "Failed to reject request" };
  }
}

export async function completeReturnRequest(
  id: string,
): Promise<ActionResult<void>> {
  try {
    const request = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        orderItem: {
          include: {
            earning: true,
            order: {
              include: { payments: true },
            },
          },
        },
      },
    });
    if (!request) {
      return { success: false, error: "Return request not found" };
    }

    const access = await canModerate(request.orderItem.sellerId);
    if (!access.ok) {
      return { success: false, error: "You cannot moderate this request" };
    }

    if (request.status !== "APPROVED") {
      return { success: false, error: "Approve the request before completing it" };
    }

    const item = request.orderItem;
    const isReturn = request.type === "RETURN";
    const refundAmount = Number(item.total);

    if (isReturn) {
      const razorpayPayment = item.order.payments.find(
        (payment) => payment.provider === "RAZORPAY",
      );
      await refundRazorpayIfNeeded(
        razorpayPayment?.providerPaymentId,
        refundAmount,
      );
    }

    const remaining = isReturn
      ? await remainingPaidItemCount(item.orderId, item.id)
      : 1;

    await prisma.$transaction(async (tx) => {
      await tx.returnRequest.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      if (isReturn) {
        await reverseEarningForOrderItem(item.id, tx);
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });

        const paymentStatus = remaining > 0 ? "PARTIALLY_REFUNDED" : "REFUNDED";
        await tx.order.update({
          where: { id: item.orderId },
          data: {
            orderStatus: remaining > 0 ? "RETURNED" : "REFUNDED",
            paymentStatus,
          },
        });

        if (remaining === 0) {
          await tx.payment.updateMany({
            where: { orderId: item.orderId },
            data: { status: "REFUNDED" },
          });
        }
      } else {
        await tx.order.update({
          where: { id: item.orderId },
          data: { orderStatus: "DELIVERED" },
        });
      }
    });

    revalidatePath("/admin/returns");
    revalidatePath("/seller/returns");
    revalidatePath("/seller/payments");
    revalidatePath("/admin/payouts");
    revalidatePath("/admin");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Complete return error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete request",
    };
  }
}

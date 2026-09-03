"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { razorpayService } from "@/lib/payments/razorpay-service";
import type { ActionResult } from "@/lib/utils";

type VerifyPaymentInput = {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function verifyPayment(
  data: VerifyPaymentInput,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
      },
    });

    if (!order || order.userId !== session.user.id) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // Verify Razorpay signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
    });

    if (!isValid) {
      return {
        success: false,
        error: "Invalid payment signature",
      };
    }

    // Update order and payment status
    await prisma.$transaction(async (tx) => {
      // Update payment record
      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          transactionId: data.razorpay_order_id,
        },
        data: {
          status: "CAPTURED",
          metadata: {
            payment_id: data.razorpay_payment_id,
            signature: data.razorpay_signature,
          },
        },
      });

      // Update order
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
        },
      });

      // Deduct stock and release reserved stock
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });
      }

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          actorId: session.user.id,
          note: "Payment confirmed",
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${order.id}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Verify payment error:", error);
    return {
      success: false,
      error: "Failed to verify payment",
    };
  }
}

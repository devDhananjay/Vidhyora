import prisma from "@/lib/prisma";
import { razorpayService } from "@/lib/payments/razorpay-service";

function isLiveRazorpayPaymentId(paymentId?: string | null) {
  if (!paymentId) return false;
  if (!paymentId.startsWith("pay_")) return false;
  if (paymentId.includes("demo")) return false;
  return true;
}

function isAlreadyRefunded(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("already") && message.includes("refund");
}

export async function refundRazorpayIfNeeded(
  paymentId: string | null | undefined,
  amountRupees: number,
) {
  if (!isLiveRazorpayPaymentId(paymentId)) {
    return { skipped: true as const };
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("Razorpay not configured — recording local refund only");
    return { skipped: true as const };
  }

  try {
    await razorpayService.refundPayment(paymentId, amountRupees);
    return { skipped: false as const };
  } catch (error) {
    if (isAlreadyRefunded(error)) {
      return { skipped: false as const };
    }
    throw error;
  }
}

export async function remainingPaidItemCount(
  orderId: string,
  excludingItemId: string,
) {
  const remaining = await prisma.orderItem.count({
    where: {
      orderId,
      id: { not: excludingItemId },
      OR: [
        { earning: { is: null } },
        { earning: { status: { not: "REVERSED" } } },
      ],
    },
  });
  return remaining;
}

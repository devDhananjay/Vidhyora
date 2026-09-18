import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { fulfillRazorpayCheckout } from "@/lib/payments/fulfill-razorpay";
import { notifyOrderConfirmed } from "@/lib/email/transactional";

export const runtime = "nodejs";

type RazorpayWebhookBody = {
  event?: string;
  id?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature") || "";
  const rawBody = await request.text();

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = body.event || "unknown";
  const payment = body.payload?.payment?.entity;
  const eventId =
    body.id ||
    `${eventType}:${payment?.id || "none"}:${payment?.order_id || "none"}`;

  const already = await prisma.processedWebhook.findUnique({
    where: {
      provider_eventId: { provider: "RAZORPAY", eventId },
    },
  });
  if (already) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (
      (eventType === "payment.captured" || eventType === "order.paid") &&
      payment?.id &&
      payment.order_id
    ) {
      const notes = payment.notes || {};
      const userId = notes.userId;
      const addressId = notes.addressId;

      if (userId && addressId) {
        const result = await fulfillRazorpayCheckout({
          userId,
          addressId,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          signature: "webhook",
          hidePriceOnInvoice: notes.hidePriceOnInvoice === "1",
          giftMessage: notes.giftMessage || null,
          occasionNote: notes.occasionNote || null,
          fastDelivery: notes.fastDelivery === "1",
          buyNowItemId: notes.buyNowItemId || undefined,
        });

        if (result.created) {
          void notifyOrderConfirmed(result.orderId).catch((error) =>
            console.error("Order email after webhook failed:", error),
          );
        }
      } else {
        const existing = await prisma.payment.findUnique({
          where: { transactionId: payment.order_id },
        });
        if (existing && existing.status !== "CAPTURED") {
          await prisma.payment.update({
            where: { id: existing.id },
            data: {
              status: "CAPTURED",
              providerPaymentId: payment.id,
            },
          });
          await prisma.order.update({
            where: { id: existing.orderId },
            data: { paymentStatus: "PAID", orderStatus: "CONFIRMED" },
          });
        }
      }
    }

    await prisma.processedWebhook.create({
      data: { provider: "RAZORPAY", eventId },
    });

    return NextResponse.json({ ok: true, event: eventType });
  } catch (error) {
    console.error("Razorpay webhook handler error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Handler failed",
      },
      { status: 500 },
    );
  }
}

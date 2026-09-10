import { createHmac, timingSafeEqual } from "crypto";
import { razorpayService } from "@/lib/payments/razorpay-service";
import type {
  CreatePaymentInput,
  PaymentProvider,
  PaymentResult,
  WebhookVerificationResult,
} from "./types";

export class RazorpayProvider implements PaymentProvider {
  name = "RAZORPAY";

  private get keyId() {
    return process.env.RAZORPAY_KEY_ID ?? "";
  }

  private get keySecret() {
    return process.env.RAZORPAY_KEY_SECRET ?? "";
  }

  private get webhookSecret() {
    return process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    const order = await razorpayService.createOrder({
      amount: Math.round(input.amount * 100),
      currency: input.currency || "INR",
      receipt: `ord_${input.orderId}`.slice(0, 40),
      notes: {
        orderId: input.orderId,
        email: input.customerEmail,
        ...(input.metadata ?? {}),
      },
    });

    return {
      providerPaymentId: order.id,
      metadata: { razorpayOrder: order },
    };
  }

  async verifyWebhook(
    body: string,
    signature: string,
  ): Promise<WebhookVerificationResult> {
    if (!this.webhookSecret) {
      return { valid: false };
    }

    const expected = createHmac("sha256", this.webhookSecret)
      .update(body)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature || "");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false };
    }

    try {
      const payload = JSON.parse(body) as {
        event?: string;
        id?: string;
        payload?: unknown;
      };
      const eventId =
        typeof payload.id === "string"
          ? payload.id
          : `${payload.event ?? "unknown"}:${createHmac("sha256", body).digest("hex").slice(0, 24)}`;

      return {
        valid: true,
        eventId,
        eventType: payload.event,
        payload,
      };
    } catch {
      return { valid: false };
    }
  }

  async capturePayment(providerPaymentId: string): Promise<void> {
    // Razorpay Checkout auto-captures for our flow; keep for interface parity.
    void providerPaymentId;
  }

  async refundPayment(
    providerPaymentId: string,
    amount?: number,
  ): Promise<void> {
    await razorpayService.refundPayment(providerPaymentId, amount);
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new RazorpayProvider();
}

export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

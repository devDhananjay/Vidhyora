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

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Phase 5: integrate Razorpay Orders API
    return {
      providerPaymentId: `rzp_order_${input.orderId}`,
      metadata: { orderId: input.orderId },
    };
  }

  async verifyWebhook(
    body: string,
    signature: string,
  ): Promise<WebhookVerificationResult> {
    void body;
    void signature;
    // Phase 5: verify using RAZORPAY_WEBHOOK_SECRET
    return { valid: false };
  }

  async capturePayment(providerPaymentId: string): Promise<void> {
    void providerPaymentId;
    // Phase 5
  }

  async refundPayment(
    providerPaymentId: string,
    amount?: number,
  ): Promise<void> {
    void providerPaymentId;
    void amount;
    // Phase 5
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new RazorpayProvider();
}

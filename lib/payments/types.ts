export type CreatePaymentInput = {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
};

export type PaymentResult = {
  providerPaymentId: string;
  checkoutUrl?: string;
  clientSecret?: string;
  metadata?: Record<string, unknown>;
};

export type WebhookVerificationResult = {
  valid: boolean;
  eventId?: string;
  eventType?: string;
  payload?: unknown;
};

export interface PaymentProvider {
  name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  verifyWebhook(
    body: string,
    signature: string,
  ): Promise<WebhookVerificationResult>;
  capturePayment(providerPaymentId: string): Promise<void>;
  refundPayment(
    providerPaymentId: string,
    amount?: number,
  ): Promise<void>;
}

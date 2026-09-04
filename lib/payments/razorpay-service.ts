// Razorpay payment integration

type RazorpayOrderOptions = {
  amount: number; // in paise (₹1 = 100 paise)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
};

type RazorpayOrder = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
};

type RazorpayVerificationData = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private baseUrl = "https://api.razorpay.com/v1";

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!this.keyId || !this.keySecret) {
      console.warn("Razorpay credentials not configured");
    }
  }

  async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder> {
    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay not configured");
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
      "base64",
    );

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Razorpay error: ${error.error?.description || "Unknown error"}`);
    }

    return response.json();
  }

  verifyPaymentSignature(data: RazorpayVerificationData): boolean {
    if (!this.keySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const crypto = require("crypto");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === razorpay_signature;
  }

  async getPaymentDetails(paymentId: string) {
    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay not configured");
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
      "base64",
    );

    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch payment details");
    }

    return response.json();
  }

  async refundPayment(paymentId: string, amountRupees?: number) {
    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay not configured");
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
      "base64",
    );

    const body: { amount?: number; notes?: Record<string, string> } = {};
    if (amountRupees != null) {
      body.amount = Math.round(amountRupees * 100);
    }

    const response = await fetch(
      `${this.baseUrl}/payments/${paymentId}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const description =
        (error as { error?: { description?: string } }).error?.description ??
        "Refund failed";
      throw new Error(`Razorpay error: ${description}`);
    }

    return response.json();
  }
} 

export const razorpayService = new RazorpayService();

export type { RazorpayOrderOptions, RazorpayOrder, RazorpayVerificationData };

import { taxAmountFromGross } from "@/lib/tax/jewellery-gst";
import { DEFAULT_COMMERCE_SETTINGS } from "@/lib/validations/site-settings";

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD${timestamp.slice(-8)}${random}`;
}

export function calculateShippingFee(
  subtotal: number,
  distanceKm?: number,
  commerce?: {
    freeShippingThreshold?: number;
    shippingFee?: number;
    fastDeliveryFee?: number;
  },
): number {
  const freeShippingThreshold =
    commerce?.freeShippingThreshold ??
    DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold;
  const baseFee = commerce?.shippingFee ?? DEFAULT_COMMERCE_SETTINGS.shippingFee;
  const fastFee = Math.max(0, commerce?.fastDeliveryFee ?? 0);

  let standard = 0;
  if (subtotal < freeShippingThreshold) {
    if (distanceKm == null) standard = baseFee;
    else if (distanceKm <= 50) standard = 0;
    else
      standard = Math.min(
        150,
        baseFee + Math.ceil((distanceKm - 50) / 10) * 10,
      );
  }

  return standard + fastFee;
}

export function calculateOrderTotals(
  items: Array<{ price: number; quantity: number; tax: number }>,
  options?: {
    discount?: number;
    distanceKm?: number;
    giftPackagingFee?: number;
    freeShippingThreshold?: number;
    shippingFee?: number;
    fastDeliveryFee?: number;
  },
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discount = Math.min(Math.max(0, options?.discount ?? 0), subtotal);
  const tax = items.reduce((sum, item) => {
    const lineGross = item.price * item.quantity;
    const share = subtotal > 0 ? lineGross / subtotal : 0;
    const lineTaxable = Math.max(0, lineGross - discount * share);
    return sum + taxAmountFromGross(lineTaxable, item.tax);
  }, 0);

  const shippingFee = calculateShippingFee(subtotal, options?.distanceKm, {
    freeShippingThreshold: options?.freeShippingThreshold,
    shippingFee: options?.shippingFee,
    fastDeliveryFee: options?.fastDeliveryFee,
  });
  const giftPackagingFee = Math.max(0, options?.giftPackagingFee ?? 0);
  const total = Math.max(
    0,
    subtotal - discount + tax + shippingFee + giftPackagingFee,
  );

  return {
    subtotal,
    tax: Math.round((tax + Number.EPSILON) * 100) / 100,
    shippingFee,
    giftPackagingFee,
    total: Math.round((total + Number.EPSILON) * 100) / 100,
    discount,
  };
}

export function canCancelOrder(orderStatus: string): boolean {
  return ["ORDERED", "CONFIRMED"].includes(orderStatus);
}

export function canRequestReturn(orderStatus: string, deliveredAt: Date | null, returnWindowDays: number): boolean {
  if (orderStatus !== "DELIVERED" || !deliveredAt) {
    return false;
  }

  const windowEnd = new Date(deliveredAt);
  windowEnd.setDate(windowEnd.getDate() + returnWindowDays);

  return new Date() <= windowEnd;
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ORDERED: "Order Placed",
    CONFIRMED: "Confirmed",
    PACKED: "Packed",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURN_REQUESTED: "Return Requested",
    RETURN_APPROVED: "Return Approved",
    RETURNED: "Returned",
    REFUNDED: "Refunded",
  };

  return labels[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ORDERED: "blue",
    CONFIRMED: "blue",
    PACKED: "purple",
    SHIPPED: "indigo",
    OUT_FOR_DELIVERY: "cyan",
    DELIVERED: "green",
    CANCELLED: "red",
    RETURN_REQUESTED: "orange",
    RETURN_APPROVED: "orange",
    RETURNED: "orange",
    REFUNDED: "green",
  };

  return colors[status] || "gray";
}

export function getPaymentProviderLabel(provider?: string | null): string {
  if (provider === "COD") return "Cash on Delivery";
  if (provider === "RAZORPAY") return "Razorpay";
  if (provider === "STRIPE") return "Stripe";
  return "Online";
}

export function getPaymentStatusLabel(
  status: string,
  provider?: string | null,
): string {
  if (
    provider === "COD" &&
    (status === "PENDING" || status === "PROCESSING")
  ) {
    return "PENDING (COD)";
  }
  if (provider === "COD" && status === "PAID") {
    return "PAID (COD)";
  }
  return status;
}

export function paymentProviderFrom(
  payments?: Array<{ provider: string }> | null,
): string | null {
  return payments?.[0]?.provider ?? null;
}

export type SellerFulfillmentStep = {
  nextStatus: "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  label: string;
  description: string;
};

export function getNextFulfillmentStep(
  currentStatus: string,
): SellerFulfillmentStep | null {
  const steps: Record<string, SellerFulfillmentStep> = {
    ORDERED: {
      nextStatus: "CONFIRMED",
      label: "Approve order",
      description: "Confirm this order so packing can start",
    },
    CONFIRMED: {
      nextStatus: "PACKED",
      label: "Mark packed",
      description: "Items are packed and ready to ship",
    },
    PACKED: {
      nextStatus: "SHIPPED",
      label: "Mark shipped",
      description: "Hand the parcel over to the courier",
    },
    SHIPPED: {
      nextStatus: "OUT_FOR_DELIVERY",
      label: "Out for delivery",
      description: "Courier is delivering today",
    },
    OUT_FOR_DELIVERY: {
      nextStatus: "DELIVERED",
      label: "Mark delivered",
      description: "Customer has received the order",
    },
  };

  return steps[currentStatus] ?? null;
}

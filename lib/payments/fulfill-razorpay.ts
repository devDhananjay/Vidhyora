import prisma from "@/lib/prisma";
import { recordEarningsForOrder } from "@/lib/payouts/record-earnings";
import {
  cartTotals,
  createShopOrder,
  stockError,
} from "@/lib/orders/place-order";
import { resolveCartCouponDiscount } from "@/lib/coupons/coupon-utils";
import { getCommerceSettings } from "@/lib/content/commerce-settings";

type FulfillInput = {
  userId: string;
  addressId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature?: string;
  hidePriceOnInvoice?: boolean;
  giftMessage?: string | null;
  occasionNote?: string | null;
  fastDelivery?: boolean;
  buyNowItemId?: string;
};

/**
 * Idempotent: create shop order after a successful Razorpay payment
 * (used by checkout confirm + webhook).
 */
export async function fulfillRazorpayCheckout(input: FulfillInput): Promise<{
  orderId: string;
  orderNumber: string;
  created: boolean;
}> {
  const existing = await prisma.payment.findUnique({
    where: { transactionId: input.razorpayOrderId },
    select: {
      orderId: true,
      order: { select: { orderNumber: true } },
    },
  });
  if (existing) {
    return {
      orderId: existing.orderId,
      orderNumber: existing.order.orderNumber,
      created: false,
    };
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: input.userId },
    include: {
      items: {
        where: { savedForLater: false },
        include: { product: true, variant: true },
      },
    },
  });
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty — cannot fulfill payment");
  }

  const buyNowItemId = input.buyNowItemId?.trim() || "";
  const checkoutItems = buyNowItemId
    ? cart.items.filter((item) => item.id === buyNowItemId)
    : cart.items;

  if (checkoutItems.length === 0) {
    throw new Error(
      buyNowItemId
        ? "Buy now item is no longer in cart — cannot fulfill payment"
        : "Cart is empty — cannot fulfill payment",
    );
  }

  const address = await prisma.address.findUnique({
    where: { id: input.addressId },
  });
  if (!address || address.userId !== input.userId) {
    throw new Error("Invalid address for payment fulfillment");
  }

  const availability = stockError(checkoutItems);
  if (availability) {
    throw new Error(availability);
  }

  const commerce = await getCommerceSettings();
  const commerceShipping = {
    freeShippingThreshold: commerce.freeShippingThreshold,
    shippingFee: commerce.shippingFee,
    fastDeliveryFee:
      commerce.fastDeliveryEnabled && input.fastDelivery
        ? commerce.fastDeliveryFee
        : 0,
  };

  let distanceKm: number | undefined;
  try {
    const { distanceKmBetweenPins, deliveryOriginPin } = await import(
      "@/lib/google/maps"
    );
    const km = await distanceKmBetweenPins(
      deliveryOriginPin(),
      address.postalCode,
    );
    if (km != null) distanceKm = km;
  } catch {
    // flat fee fallback
  }

  const lineSubtotal = checkoutItems.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0,
  );
  const applied = await resolveCartCouponDiscount(
    cart.couponCode,
    input.userId,
    lineSubtotal,
  );
  const couponOptions = {
    discount: applied?.discount ?? 0,
    couponCode: applied?.code ?? null,
    couponId: applied?.coupon.id ?? null,
  };

  const { order } = await prisma.$transaction(async (tx) => {
    const placed = await createShopOrder(tx, {
      userId: input.userId,
      address,
      items: checkoutItems,
      cartId: cart.id,
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
      deductStock: true,
      hidePriceOnInvoice: Boolean(input.hidePriceOnInvoice),
      giftMessage: input.giftMessage?.trim() || null,
      occasionNote: input.occasionNote?.trim() || null,
      commerce: commerceShipping,
      distanceKm,
      ...couponOptions,
    });

    await tx.payment.create({
      data: {
        orderId: placed.order.id,
        provider: "RAZORPAY",
        providerPaymentId: input.razorpayPaymentId,
        transactionId: input.razorpayOrderId,
        amount: placed.totals.total,
        currency: "INR",
        status: "CAPTURED",
        metadata: {
          payment_id: input.razorpayPaymentId,
          signature: input.signature ?? null,
          source: "fulfill",
        },
      },
    });

    return placed;
  });

  try {
    await recordEarningsForOrder(order.id);
  } catch (error) {
    console.error("Record seller earnings error:", error);
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    created: true,
  };
}

export function cartTotalsPreview(
  items: Array<{ variant: { price: unknown }; quantity: number }>,
  discount = 0,
) {
  return cartTotals(items as never, { discount });
}

"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { AuthError, requireAuth } from "@/lib/auth-helpers";
import { createOrderSchema } from "@/lib/validations/order";
import { razorpayService } from "@/lib/payments/razorpay-service";
import { fulfillRazorpayCheckout } from "@/lib/payments/fulfill-razorpay";
import { cartTotals, createShopOrder, stockError } from "@/lib/orders/place-order";
import { resolveCartCouponDiscount } from "@/lib/coupons/coupon-utils";
import { notifyOrderConfirmed } from "@/lib/email/transactional";
import {
  codUnavailableMessage,
  isCodAvailableForPincode,
} from "@/lib/shipping/cod";
import { getCommerceSettings } from "@/lib/content/commerce-settings";
import {
  getRequestIp,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import type { ActionResult } from "@/lib/utils";

type CreateOrderResult = {
  orderId?: string;
  orderNumber?: string;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  amount: number;
};

async function loadCheckoutCart(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        where: { savedForLater: false },
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });
}

function isIndiaAddress(country: string | null | undefined) {
  const value = String(country ?? "")
    .trim()
    .toUpperCase();
  return value === "IN" || value === "INDIA" || value === "";
}

export async function createOrder(
  formData: FormData,
): Promise<ActionResult<CreateOrderResult>> {
  try {
    const session = await requireAuth();
    const ip = await getRequestIp();
    const limited = rateLimit(`checkout:${session.user.id}:${ip}`, 20, 60_000);
    if (!limited.ok) {
      return { success: false, error: rateLimitMessage(limited.retryAfterSec) };
    }

    const validatedData = createOrderSchema.parse({
      addressId: formData.get("addressId"),
      paymentMethod: formData.get("paymentMethod") || "RAZORPAY",
      hidePriceOnInvoice: formData.get("hidePriceOnInvoice"),
      giftMessage: formData.get("giftMessage") || undefined,
      occasionNote: formData.get("occasionNote") || undefined,
      fastDelivery: formData.get("fastDelivery"),
    });

    const commerce = await getCommerceSettings();

    const cart = await loadCheckoutCart(session.user.id);
    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const address = await prisma.address.findUnique({
      where: { id: validatedData.addressId },
    });
    if (!address || address.userId !== session.user.id) {
      return { success: false, error: "Invalid address" };
    }

    if (!isIndiaAddress(address.country)) {
      return {
        success: false,
        error:
          "Checkout currently supports India addresses only. Email support for international orders.",
      };
    }

    if (validatedData.paymentMethod === "RAZORPAY" && !commerce.razorpayEnabled) {
      return { success: false, error: "Online payment is temporarily unavailable" };
    }

    if (validatedData.paymentMethod === "COD") {
      if (!commerce.codEnabled) {
        return { success: false, error: "Cash on Delivery is currently disabled" };
      }
      if (!isCodAvailableForPincode(address.postalCode)) {
        return {
          success: false,
          error: codUnavailableMessage(address.postalCode),
        };
      }
    }

    const availability = stockError(cart.items);
    if (availability) {
      return { success: false, error: availability };
    }

    const lineSubtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    );
    const applied = await resolveCartCouponDiscount(
      cart.couponCode,
      session.user.id,
      lineSubtotal,
    );
    const couponOptions = {
      discount: applied?.discount ?? 0,
      couponCode: applied?.code ?? null,
      couponId: applied?.coupon.id ?? null,
    };
    const commerceShipping = {
      freeShippingThreshold: commerce.freeShippingThreshold,
      shippingFee: commerce.shippingFee,
      fastDeliveryFee:
        commerce.fastDeliveryEnabled && validatedData.fastDelivery
          ? commerce.fastDeliveryFee
          : 0,
    };
    const totals = cartTotals(cart.items, {
      discount: couponOptions.discount,
      ...commerceShipping,
    });

    if (
      validatedData.paymentMethod === "COD" &&
      commerce.maxCodOrderAmount > 0 &&
      totals.total > commerce.maxCodOrderAmount
    ) {
      return {
        success: false,
        error: `COD is limited to orders up to ₹${commerce.maxCodOrderAmount}. Please pay online.`,
      };
    }

    const hidePriceOnInvoice = Boolean(validatedData.hidePriceOnInvoice);
    const giftMessage = validatedData.giftMessage || null;
    const occasionNote = validatedData.occasionNote || null;

    if (validatedData.paymentMethod === "RAZORPAY") {
      const razorpayOrder = await razorpayService.createOrder({
        amount: Math.round(totals.total * 100),
        currency: "INR",
        receipt: `chk${Date.now()}`.slice(0, 40),
        notes: {
          userId: session.user.id,
          addressId: address.id,
          couponCode: couponOptions.couponCode ?? "",
          hidePriceOnInvoice: hidePriceOnInvoice ? "1" : "0",
          giftMessage: giftMessage ?? "",
          occasionNote: occasionNote ?? "",
          fastDelivery: commerceShipping.fastDeliveryFee > 0 ? "1" : "0",
        },
      });

      return {
        success: true,
        data: {
          razorpayOrderId: razorpayOrder.id,
          razorpayKeyId:
            process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
            process.env.RAZORPAY_KEY_ID ||
            "",
          amount: totals.total,
        },
      };
    }

    const { order } = await prisma.$transaction(async (tx) => {
      const placed = await createShopOrder(tx, {
        userId: session.user.id,
        address,
        items: cart.items,
        cartId: cart.id,
        paymentStatus: "PENDING",
        orderStatus: "ORDERED",
        deductStock: false,
        hidePriceOnInvoice,
        giftMessage,
        occasionNote,
        commerce: commerceShipping,
        ...couponOptions,
      });

      await tx.payment.create({
        data: {
          orderId: placed.order.id,
          provider: "COD",
          transactionId: `cod_${placed.order.orderNumber}`,
          amount: placed.totals.total,
          currency: "INR",
          status: "CREATED",
        },
      });

      return placed;
    });

    revalidatePath("/cart");
    revalidatePath("/orders");
    revalidatePath("/checkout");
    revalidatePath("/seller");
    revalidatePath("/seller/orders");
    revalidatePath("/admin/orders");

    void notifyOrderConfirmed(order.id).catch((error) =>
      console.error("COD order email failed:", error),
    );

    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: totals.total,
      },
    };
  } catch (error) {
    console.error("Create order error:", error);
    if (error instanceof AuthError) {
      return { success: false, error: "Please log in to place an order" };
    }
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid checkout details",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error && error.message.startsWith("Razorpay")
          ? error.message
          : "Failed to create order",
    };
  }
}

export async function confirmRazorpayOrder(input: {
  addressId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  hidePriceOnInvoice?: boolean;
  giftMessage?: string;
  occasionNote?: string;
  fastDelivery?: boolean;
}): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const session = await requireAuth();

    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id: input.razorpay_order_id,
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_signature: input.razorpay_signature,
    });
    if (!isValid) {
      return { success: false, error: "Invalid payment signature" };
    }

    const result = await fulfillRazorpayCheckout({
      userId: session.user.id,
      addressId: input.addressId,
      razorpayOrderId: input.razorpay_order_id,
      razorpayPaymentId: input.razorpay_payment_id,
      signature: input.razorpay_signature,
      hidePriceOnInvoice: Boolean(input.hidePriceOnInvoice),
      giftMessage: input.giftMessage,
      occasionNote: input.occasionNote,
      fastDelivery: Boolean(input.fastDelivery),
    });

    if (result.created) {
      void notifyOrderConfirmed(result.orderId).catch((error) =>
        console.error("Razorpay order email failed:", error),
      );
    }

    revalidatePath("/cart");
    revalidatePath("/orders");
    revalidatePath(`/orders/${result.orderId}`);
    revalidatePath("/checkout");
    revalidatePath("/seller");
    revalidatePath("/seller/orders");
    revalidatePath("/admin/orders");

    return {
      success: true,
      data: { orderId: result.orderId, orderNumber: result.orderNumber },
    };
  } catch (error) {
    console.error("Confirm Razorpay order error:", error);
    if (error instanceof AuthError) {
      return { success: false, error: "Please log in to place an order" };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to confirm payment",
    };
  }
}

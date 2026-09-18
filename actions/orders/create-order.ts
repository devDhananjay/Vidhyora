"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { AuthError } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth";
import { createOrderSchema, guestCheckoutAddressSchema } from "@/lib/validations/order";
import { ensureGuestCheckoutUser } from "@/lib/checkout/guest-user";
import { getGuestCartToken } from "@/lib/cart/cart-session";
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
  addressId?: string;
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
    const session = await auth();
    const ip = await getRequestIp();
    const rateKey = session?.user?.id || (await getGuestCartToken()) || ip;
    const limited = rateLimit(`checkout:${rateKey}:${ip}`, 20, 60_000);
    if (!limited.ok) {
      return { success: false, error: rateLimitMessage(limited.retryAfterSec) };
    }

    const validatedData = createOrderSchema.parse({
      addressId: formData.get("addressId") || undefined,
      paymentMethod: formData.get("paymentMethod") || "RAZORPAY",
      hidePriceOnInvoice: formData.get("hidePriceOnInvoice"),
      giftMessage: formData.get("giftMessage") || undefined,
      occasionNote: formData.get("occasionNote") || undefined,
      fastDelivery: formData.get("fastDelivery"),
      guestFullName: formData.get("guestFullName") || undefined,
      guestEmail: formData.get("guestEmail") || undefined,
      guestPhone: formData.get("guestPhone") || undefined,
      guestLine1: formData.get("guestLine1") || undefined,
      guestLine2: formData.get("guestLine2") || undefined,
      guestCity: formData.get("guestCity") || undefined,
      guestState: formData.get("guestState") || undefined,
      guestPostalCode: formData.get("guestPostalCode") || undefined,
      guestCountry: formData.get("guestCountry") || "IN",
    });

    const commerce = await getCommerceSettings();

    let userId = session?.user?.id ?? null;
    let address: Awaited<ReturnType<typeof prisma.address.findUnique>> = null;

    if (userId && validatedData.addressId) {
      address = await prisma.address.findUnique({
        where: { id: validatedData.addressId },
      });
      if (!address || address.userId !== userId) {
        return { success: false, error: "Invalid address" };
      }
    } else {
      const guest = guestCheckoutAddressSchema.parse({
        fullName: validatedData.guestFullName,
        email: validatedData.guestEmail,
        phone: validatedData.guestPhone,
        line1: validatedData.guestLine1,
        line2: validatedData.guestLine2 || "",
        city: validatedData.guestCity,
        state: validatedData.guestState,
        postalCode: validatedData.guestPostalCode,
        country: validatedData.guestCountry || "IN",
      });

      const user = await ensureGuestCheckoutUser({
        email: guest.email,
        name: guest.fullName,
        phone: guest.phone,
      });
      userId = user.id;

      const { mergeGuestCartIntoUser } = await import("@/lib/cart/cart-session");
      await mergeGuestCartIntoUser(userId);

      address = await prisma.address.create({
        data: {
          userId,
          name: guest.fullName,
          phone: guest.phone,
          addressLine1: guest.line1,
          addressLine2: guest.line2 || null,
          city: guest.city,
          state: guest.state,
          postalCode: guest.postalCode,
          country: guest.country || "IN",
          isDefault: true,
        },
      });
    }

    if (!userId || !address) {
      return { success: false, error: "Delivery address is required" };
    }

    const cart = await loadCheckoutCart(userId);
    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const buyNowItemId = String(formData.get("buyNowItemId") || "").trim();
    const checkoutItems = buyNowItemId
      ? cart.items.filter((item) => item.id === buyNowItemId)
      : cart.items;

    if (checkoutItems.length === 0) {
      return {
        success: false,
        error: buyNowItemId
          ? "Buy now item is no longer in your cart"
          : "Cart is empty",
      };
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

    const availability = stockError(checkoutItems);
    if (availability) {
      return { success: false, error: availability };
    }

    const lineSubtotal = checkoutItems.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    );
    const applied = await resolveCartCouponDiscount(
      cart.couponCode,
      userId,
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
      // Flat shipping fee fallback when Maps is unavailable
    }

    const totals = cartTotals(checkoutItems, {
      discount: couponOptions.discount,
      distanceKm,
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
          userId,
          addressId: address.id,
          couponCode: couponOptions.couponCode ?? "",
          hidePriceOnInvoice: hidePriceOnInvoice ? "1" : "0",
          giftMessage: giftMessage ?? "",
          occasionNote: occasionNote ?? "",
          fastDelivery: commerceShipping.fastDeliveryFee > 0 ? "1" : "0",
          buyNowItemId: buyNowItemId || "",
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
          addressId: address.id,
        },
      };
    }

    const { order } = await prisma.$transaction(async (tx) => {
      const placed = await createShopOrder(tx, {
        userId,
        address,
        items: checkoutItems,
        cartId: cart.id,
        paymentStatus: "PENDING",
        orderStatus: "ORDERED",
        deductStock: false,
        hidePriceOnInvoice,
        giftMessage,
        occasionNote,
        commerce: commerceShipping,
        distanceKm,
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
  buyNowItemId?: string;
}): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const session = await auth();

    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id: input.razorpay_order_id,
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_signature: input.razorpay_signature,
    });
    if (!isValid) {
      return { success: false, error: "Invalid payment signature" };
    }

    const address = await prisma.address.findUnique({
      where: { id: input.addressId },
    });
    if (!address) {
      return { success: false, error: "Invalid address" };
    }
    if (session?.user?.id && session.user.id !== address.userId) {
      return { success: false, error: "Invalid address" };
    }

    const result = await fulfillRazorpayCheckout({
      userId: address.userId,
      addressId: address.id,
      razorpayOrderId: input.razorpay_order_id,
      razorpayPaymentId: input.razorpay_payment_id,
      signature: input.razorpay_signature,
      hidePriceOnInvoice: Boolean(input.hidePriceOnInvoice),
      giftMessage: input.giftMessage,
      occasionNote: input.occasionNote,
      fastDelivery: Boolean(input.fastDelivery),
      buyNowItemId: input.buyNowItemId?.trim() || undefined,
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

"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { AuthError, requireAuth } from "@/lib/auth-helpers";
import { createOrderSchema } from "@/lib/validations/order";
import { razorpayService } from "@/lib/payments/razorpay-service";
import { recordEarningsForOrder } from "@/lib/payouts/record-earnings";
import { cartTotals, createShopOrder, stockError } from "@/lib/orders/place-order";
import { resolveCartCouponDiscount } from "@/lib/coupons/coupon-utils";
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

export async function createOrder(
  formData: FormData,
): Promise<ActionResult<CreateOrderResult>> {
  try {
    const session = await requireAuth();
    const validatedData = createOrderSchema.parse({
      addressId: formData.get("addressId"),
      paymentMethod: formData.get("paymentMethod") || "RAZORPAY",
    });

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
    const totals = cartTotals(cart.items, { discount: couponOptions.discount });

    if (validatedData.paymentMethod === "RAZORPAY") {
      const razorpayOrder = await razorpayService.createOrder({
        amount: Math.round(totals.total * 100),
        currency: "INR",
        receipt: `chk${Date.now()}`.slice(0, 40),
        notes: {
          userId: session.user.id,
          addressId: address.id,
          couponCode: couponOptions.couponCode ?? "",
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

    const existing = await prisma.payment.findUnique({
      where: { transactionId: input.razorpay_order_id },
      select: { orderId: true, order: { select: { orderNumber: true } } },
    });
    if (existing) {
      return {
        success: true,
        data: {
          orderId: existing.orderId,
          orderNumber: existing.order.orderNumber,
        },
      };
    }

    const cart = await loadCheckoutCart(session.user.id);
    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const address = await prisma.address.findUnique({
      where: { id: input.addressId },
    });
    if (!address || address.userId !== session.user.id) {
      return { success: false, error: "Invalid address" };
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

    const { order } = await prisma.$transaction(async (tx) => {
      const placed = await createShopOrder(tx, {
        userId: session.user.id,
        address,
        items: cart.items,
        cartId: cart.id,
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        deductStock: true,
        ...couponOptions,
      });

      await tx.payment.create({
        data: {
          orderId: placed.order.id,
          provider: "RAZORPAY",
          providerPaymentId: input.razorpay_payment_id,
          transactionId: input.razorpay_order_id,
          amount: placed.totals.total,
          currency: "INR",
          status: "CAPTURED",
          metadata: {
            payment_id: input.razorpay_payment_id,
            signature: input.razorpay_signature,
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

    revalidatePath("/cart");
    revalidatePath("/orders");
    revalidatePath(`/orders/${order.id}`);
    revalidatePath("/checkout");
    revalidatePath("/seller");
    revalidatePath("/seller/orders");
    revalidatePath("/admin/orders");

    return {
      success: true,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    };
  } catch (error) {
    console.error("Confirm Razorpay order error:", error);
    if (error instanceof AuthError) {
      return { success: false, error: "Please log in to place an order" };
    }
    return { success: false, error: "Failed to confirm payment" };
  }
}

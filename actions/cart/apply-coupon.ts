"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { validateCouponForUser } from "@/lib/coupons/coupon-utils";
import type { ActionResult } from "@/lib/utils";

function cartSubtotal(
  items: Array<{ quantity: number; variant: { price: unknown } }>,
) {
  return items.reduce((sum, item) => {
    return sum + Number(item.variant.price) * item.quantity;
  }, 0);
}

export async function applyCoupon(
  formData: FormData,
): Promise<ActionResult<{ code: string; discount: number }>> {
  try {
    const session = await requireAuth();
    const code = String(formData.get("code") ?? "");

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          where: { savedForLater: false },
          include: { variant: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    const subtotal = cartSubtotal(cart.items);
    const validated = await validateCouponForUser(
      code,
      session.user.id,
      subtotal,
    );

    if (!validated.ok) {
      return { success: false, error: validated.error };
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: validated.data.code },
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");

    return {
      success: true,
      data: {
        code: validated.data.code,
        discount: validated.data.discount,
      },
    };
  } catch (error) {
    console.error("Apply coupon error:", error);
    return { success: false, error: "Failed to apply promo code" };
  }
}

export async function removeCoupon(): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    await prisma.cart.updateMany({
      where: { userId: session.user.id },
      data: { couponCode: null },
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Remove coupon error:", error);
    return { success: false, error: "Failed to remove promo code" };
  }
}

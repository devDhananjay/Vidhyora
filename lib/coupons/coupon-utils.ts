import type { Coupon } from "@prisma/client";
import prisma from "@/lib/prisma";

export type CouponDiscountResult = {
  coupon: Coupon;
  code: string;
  discount: number;
};

export function computeCouponDiscount(
  coupon: Pick<
    Coupon,
    "discountType" | "discountValue" | "maximumDiscount" | "minimumOrderValue"
  >,
  subtotal: number,
): number {
  if (subtotal < Number(coupon.minimumOrderValue)) {
    return 0;
  }

  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (subtotal * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);

  if (coupon.maximumDiscount != null) {
    discount = Math.min(discount, Number(coupon.maximumDiscount));
  }

  return Math.min(Math.max(0, discount), subtotal);
}

export async function validateCouponForUser(
  code: string,
  userId: string,
  subtotal: number,
): Promise<{ ok: true; data: CouponDiscountResult } | { ok: false; error: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, error: "Enter a promo code" };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });

  if (!coupon || !coupon.isActive) {
    return { ok: false, error: "Invalid or inactive promo code" };
  }

  const now = new Date();
  if (now < coupon.startDate) {
    return { ok: false, error: "This promo code is not active yet" };
  }
  if (now > coupon.expiryDate) {
    return { ok: false, error: "This promo code has expired" };
  }

  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, error: "This promo code has reached its usage limit" };
  }

  const userUsageCount = await prisma.couponUsage.count({
    where: { couponId: coupon.id, userId },
  });
  if (userUsageCount >= coupon.perUserLimit) {
    return {
      ok: false,
      error: "You have already used this promo code the maximum number of times",
    };
  }

  const minOrder = Number(coupon.minimumOrderValue);
  if (subtotal < minOrder) {
    return {
      ok: false,
      error: `Minimum order value for this code is ₹${minOrder.toLocaleString("en-IN")}`,
    };
  }

  const discount = computeCouponDiscount(coupon, subtotal);
  if (discount <= 0) {
    return { ok: false, error: "This promo code cannot be applied to your cart" };
  }

  return {
    ok: true,
    data: { coupon, code: coupon.code, discount },
  };
}

export async function resolveCartCouponDiscount(
  couponCode: string | null | undefined,
  userId: string,
  subtotal: number,
): Promise<CouponDiscountResult | null> {
  if (!couponCode) return null;

  const result = await validateCouponForUser(couponCode, userId, subtotal);
  if (!result.ok) return null;
  return result.data;
}

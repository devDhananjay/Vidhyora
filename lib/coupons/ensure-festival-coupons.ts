import prisma from "@/lib/prisma";
import {
  assertMarginSafeCoupon,
  getActiveFestivalCampaigns,
  type FestivalCouponDef,
} from "@/lib/content/festival-banners";

async function upsertCoupon(
  coupon: FestivalCouponDef,
  startDate: Date,
  expiryDate: Date,
) {
  assertMarginSafeCoupon(coupon);
  await prisma.coupon.upsert({
    where: { code: coupon.code },
    create: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderValue: coupon.minimumOrderValue,
      maximumDiscount: coupon.maximumDiscount,
      startDate,
      expiryDate,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      isActive: true,
    },
    update: {
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderValue: coupon.minimumOrderValue,
      maximumDiscount: coupon.maximumDiscount,
      startDate,
      expiryDate,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      isActive: true,
    },
  });
}

/**
 * Upsert coupons for currently-active festival banners so codes on the hero
 * are always valid. Safe to call on homepage render (idempotent).
 */
export async function ensureActiveFestivalCoupons(now: Date = new Date()) {
  const active = getActiveFestivalCampaigns(now);
  if (active.length === 0) return { upserted: [] as string[] };

  const upserted: string[] = [];
  for (const campaign of active) {
    try {
      await upsertCoupon(
        campaign.coupon,
        new Date(campaign.visibleFrom),
        new Date(campaign.visibleUntil),
      );
      upserted.push(campaign.coupon.code);
    } catch (error) {
      console.error("ensureActiveFestivalCoupons", campaign.coupon.code, error);
    }
  }
  return { upserted };
}

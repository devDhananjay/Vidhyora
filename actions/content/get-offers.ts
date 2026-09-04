"use server";

import prisma from "@/lib/prisma";

export async function getPublicOffers() {
  const now = new Date();

  return prisma.coupon.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      expiryDate: { gte: now },
    },
    orderBy: { expiryDate: "asc" },
    select: {
      id: true,
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      minimumOrderValue: true,
      maximumDiscount: true,
      expiryDate: true,
      perUserLimit: true,
    },
  });
}

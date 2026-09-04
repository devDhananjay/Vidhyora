"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { syncUnrecordedEarnings } from "@/lib/payouts/record-earnings";

export async function getSellerPayments() {
  try {
    const acting = await getActingSeller();
    if (!acting) return null;

    await syncUnrecordedEarnings();

    const [earnings, payouts, profile] = await Promise.all([
      prisma.sellerEarning.findMany({
        where: { sellerId: acting.sellerUserId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.sellerPayout.findMany({
        where: { sellerId: acting.sellerUserId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.sellerProfile.findUnique({
        where: { sellerId: acting.sellerUserId },
        select: {
          commissionPercentage: true,
          bankName: true,
          bankAccountNumber: true,
          bankIfscCode: true,
          businessName: true,
        },
      }),
    ]);

    const totals = earnings.reduce(
      (acc, row) => {
        acc.gross += Number(row.grossAmount);
        acc.commission += Number(row.commissionAmount);
        acc.net += Number(row.netAmount);
        if (row.status === "AVAILABLE") {
          acc.available += Number(row.netAmount);
        }
        if (row.status === "INCLUDED") {
          acc.paid += Number(row.netAmount);
        }
        return acc;
      },
      { gross: 0, commission: 0, net: 0, available: 0, paid: 0 },
    );

    return {
      profile: profile
        ? {
            ...profile,
            commissionPercentage: Number(profile.commissionPercentage),
          }
        : null,
      totals,
      earnings: earnings.map((row) => ({
        ...row,
        grossAmount: Number(row.grossAmount),
        commissionRate: Number(row.commissionRate),
        commissionAmount: Number(row.commissionAmount),
        netAmount: Number(row.netAmount),
      })),
      payouts: payouts.map((row) => ({
        ...row,
        amount: Number(row.amount),
        commission: Number(row.commission),
        gross: Number(row.gross),
      })),
    };
  } catch (error) {
    console.error("Get seller payments error:", error);
    return {
      profile: null,
      totals: { gross: 0, commission: 0, net: 0, available: 0, paid: 0 },
      earnings: [],
      payouts: [],
    };
  }
}

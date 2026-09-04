"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { syncUnrecordedEarnings } from "@/lib/payouts/record-earnings";

export async function getPayoutOverview() {
  try {
    await requireAdmin();
    await syncUnrecordedEarnings();

  const [earnings, payouts, sellers] = await Promise.all([
    prisma.sellerEarning.groupBy({
      by: ["sellerId", "status"],
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
      },
      _count: { _all: true },
    }),
    prisma.sellerPayout.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          select: {
            businessName: true,
            seller: { select: { email: true } },
          },
        },
        _count: { select: { earnings: true } },
      },
    }),
    prisma.sellerProfile.findMany({
      select: {
        sellerId: true,
        businessName: true,
        commissionPercentage: true,
        bankName: true,
        bankAccountNumber: true,
        seller: { select: { email: true, name: true } },
      },
      orderBy: { businessName: "asc" },
    }),
  ]);

  const totals = {
    gmv: 0,
    commissionEarned: 0,
    sellerShare: 0,
    pendingPayouts: 0,
    settled: 0,
  };

  const bySeller = new Map<
    string,
    {
      availableGross: number;
      availableCommission: number;
      availableNet: number;
      availableCount: number;
      paidNet: number;
    }
  >();

  for (const row of earnings) {
    const gross = Number(row._sum.grossAmount || 0);
    const commission = Number(row._sum.commissionAmount || 0);
    const net = Number(row._sum.netAmount || 0);
    totals.gmv += gross;
    totals.commissionEarned += commission;
    totals.sellerShare += net;

    const current = bySeller.get(row.sellerId) ?? {
      availableGross: 0,
      availableCommission: 0,
      availableNet: 0,
      availableCount: 0,
      paidNet: 0,
    };

    if (row.status === "AVAILABLE") {
      current.availableGross += gross;
      current.availableCommission += commission;
      current.availableNet += net;
      current.availableCount += row._count._all;
      totals.pendingPayouts += net;
    }
    if (row.status === "INCLUDED") {
      current.paidNet += net;
      totals.settled += net;
    }

    bySeller.set(row.sellerId, current);
  }

  const sellerRows = sellers
    .map((seller) => {
      const amounts = bySeller.get(seller.sellerId) ?? {
        availableGross: 0,
        availableCommission: 0,
        availableNet: 0,
        availableCount: 0,
        paidNet: 0,
      };
      return {
        ...seller,
        commissionPercentage: Number(seller.commissionPercentage),
        ...amounts,
      };
    })
    .sort((a, b) => b.availableNet - a.availableNet);

  return {
    totals,
    sellers: sellerRows,
    payouts: payouts.map((payout) => ({
      ...payout,
      amount: Number(payout.amount),
      commission: Number(payout.commission),
      gross: Number(payout.gross),
    })),
  };
  } catch (error) {
    console.error("Get payout overview error:", error);
    return {
      totals: {
        gmv: 0,
        commissionEarned: 0,
        sellerShare: 0,
        pendingPayouts: 0,
        settled: 0,
      },
      sellers: [],
      payouts: [],
    };
  }
}

export async function settleSellerPayout(
  sellerId: string,
  note?: string,
): Promise<ActionResult<{ payoutId: string }>> {
  try {
    await requireAdmin();
    await syncUnrecordedEarnings();

    const available = await prisma.sellerEarning.findMany({
      where: { sellerId, status: "AVAILABLE" },
    });

    if (available.length === 0) {
      return { success: false, error: "No available earnings to settle" };
    }

    const gross = available.reduce((sum, row) => sum + Number(row.grossAmount), 0);
    const commission = available.reduce(
      (sum, row) => sum + Number(row.commissionAmount),
      0,
    );
    const amount = available.reduce((sum, row) => sum + Number(row.netAmount), 0);

    const payout = await prisma.$transaction(async (tx) => {
      const created = await tx.sellerPayout.create({
        data: {
          sellerId,
          gross,
          commission,
          amount,
          status: "PAID",
          note: note?.trim() || null,
          paidAt: new Date(),
        },
      });

      await tx.sellerEarning.updateMany({
        where: { id: { in: available.map((row) => row.id) } },
        data: {
          status: "INCLUDED",
          payoutId: created.id,
        },
      });

      return created;
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/admin");
    revalidatePath("/seller/payments");
    revalidatePath(`/admin/sellers/${sellerId}`);

    return { success: true, data: { payoutId: payout.id } };
  } catch (error) {
    console.error("Settle seller payout error:", error);
    return { success: false, error: "Failed to settle payout" };
  }
}

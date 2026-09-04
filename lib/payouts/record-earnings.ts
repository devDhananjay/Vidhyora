import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { resolveCommissionRate, splitSale } from "@/lib/commission";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function recordEarningsForOrder(
  orderId: string,
  db: DbClient = prisma,
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              category: {
                select: { commissionPercentage: true },
              },
            },
          },
          earning: { select: { id: true } },
        },
      },
    },
  });

  if (!order || order.paymentStatus !== "PAID") {
    return;
  }

  const pendingItems = order.items.filter((item) => !item.earning);
  if (pendingItems.length === 0) {
    return;
  }

  const sellerIds = [...new Set(pendingItems.map((item) => item.sellerId))];
  const sellers = await db.sellerProfile.findMany({
    where: { sellerId: { in: sellerIds } },
    select: { sellerId: true, commissionPercentage: true },
  });
  const sellerRate = new Map(
    sellers.map((seller) => [
      seller.sellerId,
      Number(seller.commissionPercentage),
    ]),
  );

  for (const item of pendingItems) {
    const categoryRate = item.product.category.commissionPercentage;
    const rate = resolveCommissionRate({
      categoryRate:
        categoryRate == null ? null : Number(categoryRate),
      sellerRate: sellerRate.get(item.sellerId) ?? null,
    });
    const gross = Number(item.total);
    const { commissionAmount, netAmount } = splitSale(gross, rate);

    await db.sellerEarning.create({
      data: {
        sellerId: item.sellerId,
        orderId: order.id,
        orderItemId: item.id,
        orderNumber: order.orderNumber,
        productName: item.productName,
        grossAmount: gross,
        commissionRate: rate,
        commissionAmount,
        netAmount,
        status: "AVAILABLE",
      },
    });
  }
}

export async function reverseEarningForOrderItem(
  orderItemId: string,
  db: DbClient = prisma,
) {
  const earning = await db.sellerEarning.findUnique({
    where: { orderItemId },
  });
  if (!earning || earning.status === "REVERSED") {
    return;
  }

  await db.sellerEarning.update({
    where: { id: earning.id },
    data: { status: "REVERSED" },
  });
}

export async function syncUnrecordedEarnings() {
  try {
    const unpaidRecorded = await prisma.orderItem.findMany({
      where: {
        order: { paymentStatus: "PAID" },
        earning: { is: null },
      },
      select: { orderId: true },
      distinct: ["orderId"],
    });

    for (const row of unpaidRecorded) {
      await recordEarningsForOrder(row.orderId);
    }
  } catch (error) {
    console.error("Sync unrecorded earnings error:", error);
  }
}

"use server";

import prisma from "@/lib/prisma";
import { getSellerStats, type SellerStats } from "@/actions/seller/get-seller-stats";
import { getActingSeller } from "@/lib/seller-context";

export type SellerAnalytics = {
  stats: SellerStats;
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    productName: string;
    total: number;
    orderStatus: string;
    createdAt: Date;
    customerName: string | null;
  }[];
};

export async function getSellerAnalytics(): Promise<SellerAnalytics> {
  const emptyStats = await getSellerStats();
  const empty: SellerAnalytics = {
    stats: emptyStats,
    ordersByStatus: [],
    topProducts: [],
    recentOrders: [],
  };

  try {
    const acting = await getActingSeller();
    if (!acting) {
      return empty;
    }

    const items = await prisma.orderItem.findMany({
      where: { sellerId: acting.sellerUserId },
      include: {
        order: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    const statusMap = new Map<string, number>();
    const productMap = new Map<string, { quantity: number; revenue: number }>();

    for (const item of items) {
      statusMap.set(
        item.order.orderStatus,
        (statusMap.get(item.order.orderStatus) ?? 0) + 1,
      );
      const current = productMap.get(item.productName) ?? {
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue += Number(item.total);
      productMap.set(item.productName, current);
    }

    return {
      stats: emptyStats,
      ordersByStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      topProducts: Array.from(productMap.entries())
        .map(([name, value]) => ({ name, ...value }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
      recentOrders: items.slice(0, 8).map((item) => ({
        id: item.id,
        orderNumber: item.order.orderNumber,
        productName: item.productName,
        total: Number(item.total),
        orderStatus: item.order.orderStatus,
        createdAt: item.order.createdAt,
        customerName: item.order.user.name,
      })),
    };
  } catch (error) {
    console.error("Get seller analytics error:", error);
    return empty;
  }
}

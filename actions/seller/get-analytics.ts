"use server";

import prisma from "@/lib/prisma";
import { getSellerStats, type SellerStats } from "@/actions/seller/get-seller-stats";
import { getActingSeller } from "@/lib/seller-context";
import { format, eachDayOfInterval, startOfDay, subDays } from "date-fns";

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
  dailyTrend: { date: string; orders: number; revenue: number }[];
  range: { from: string; to: string };
};

function parseRange(from?: string, to?: string) {
  const end = to ? startOfDay(new Date(to)) : startOfDay(new Date());
  const start = from
    ? startOfDay(new Date(from))
    : startOfDay(subDays(end, 29));
  // Include end of "to" day
  const endExclusive = new Date(end);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return { start, end, endExclusive };
}

export async function getSellerAnalytics(options?: {
  from?: string;
  to?: string;
}): Promise<SellerAnalytics> {
  const emptyStats = await getSellerStats();
  const { start, end, endExclusive } = parseRange(options?.from, options?.to);
  const empty: SellerAnalytics = {
    stats: emptyStats,
    ordersByStatus: [],
    topProducts: [],
    recentOrders: [],
    dailyTrend: [],
    range: {
      from: format(start, "yyyy-MM-dd"),
      to: format(end, "yyyy-MM-dd"),
    },
  };

  try {
    const acting = await getActingSeller();
    if (!acting) {
      return empty;
    }

    const items = await prisma.orderItem.findMany({
      where: {
        sellerId: acting.sellerUserId,
        order: {
          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      },
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
    const dayMap = new Map<string, { orders: number; revenue: number }>();

    for (const day of eachDayOfInterval({ start, end })) {
      dayMap.set(format(day, "yyyy-MM-dd"), { orders: 0, revenue: 0 });
    }

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

      const dayKey = format(item.order.createdAt, "yyyy-MM-dd");
      const day = dayMap.get(dayKey) ?? { orders: 0, revenue: 0 };
      day.orders += 1;
      day.revenue += Number(item.total);
      dayMap.set(dayKey, day);
    }

    const rangeRevenue = items.reduce((sum, i) => sum + Number(i.total), 0);
    const uniqueOrders = new Set(items.map((i) => i.orderId)).size;

    return {
      stats: {
        ...emptyStats,
        totalRevenue: rangeRevenue,
        totalOrders: uniqueOrders,
        thisMonthRevenue: rangeRevenue,
      },
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
      dailyTrend: Array.from(dayMap.entries()).map(([date, value]) => ({
        date,
        ...value,
      })),
      range: {
        from: format(start, "yyyy-MM-dd"),
        to: format(end, "yyyy-MM-dd"),
      },
    };
  } catch (error) {
    console.error("Get seller analytics error:", error);
    return empty;
  }
}

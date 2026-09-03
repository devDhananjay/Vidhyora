"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminStats, type AdminStats } from "@/actions/admin/get-admin-stats";

export type AnalyticsData = {
  stats: AdminStats;
  ordersByStatus: { status: string; count: number }[];
  paymentsByStatus: { status: string; count: number; amount: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    total: number;
    orderStatus: string;
    createdAt: Date;
    userName: string | null;
  }[];
};

export async function getAdminAnalytics(): Promise<AnalyticsData> {
  try {
    await requireAdmin();

    const [stats, ordersByStatus, payments, orderItems, recentOrders] =
      await Promise.all([
        getAdminStats(),
        prisma.order.groupBy({
          by: ["orderStatus"],
          _count: { _all: true },
        }),
        prisma.payment.findMany({
          select: { status: true, amount: true },
        }),
        prisma.orderItem.findMany({
          select: { productName: true, quantity: true, total: true },
        }),
        prisma.order.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true } },
          },
        }),
      ]);

    const paymentMap = new Map<string, { count: number; amount: number }>();
    for (const payment of payments) {
      const current = paymentMap.get(payment.status) ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(payment.amount);
      paymentMap.set(payment.status, current);
    }

    const productMap = new Map<
      string,
      { quantity: number; revenue: number }
    >();
    for (const item of orderItems) {
      const current = productMap.get(item.productName) ?? {
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue += Number(item.total);
      productMap.set(item.productName, current);
    }

    return {
      stats,
      ordersByStatus: ordersByStatus.map((row) => ({
        status: row.orderStatus,
        count: row._count._all,
      })),
      paymentsByStatus: Array.from(paymentMap.entries()).map(
        ([status, value]) => ({
          status,
          count: value.count,
          amount: value.amount,
        }),
      ),
      topProducts: Array.from(productMap.entries())
        .map(([name, value]) => ({ name, ...value }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        userName: order.user.name,
      })),
    };
  } catch (error) {
    console.error("Get admin analytics error:", error);
    return {
      stats: {
        totalUsers: 0,
        totalCustomers: 0,
        totalSellers: 0,
        pendingSellers: 0,
        totalProducts: 0,
        pendingProducts: 0,
        approvedProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        pendingReviews: 0,
        activeCoupons: 0,
        totalCategories: 0,
      },
      ordersByStatus: [],
      paymentsByStatus: [],
      topProducts: [],
      recentOrders: [],
    };
  }
}

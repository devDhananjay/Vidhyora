"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export type AdminStats = {
  totalUsers: number;
  totalCustomers: number;
  totalSellers: number;
  pendingSellers: number;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingReviews: number;
  pendingReturns: number;
  activeCoupons: number;
  totalCategories: number;
  commissionEarned: number;
  pendingPayouts: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  try {
    await requireAdmin();

    // User stats
    const [totalUsers, totalCustomers, totalSellers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "SELLER" } }),
    ]);

    // Seller stats
    const pendingSellers = await prisma.sellerProfile.count({
      where: { verificationStatus: "PENDING" },
    });

    // Product stats
    const [totalProducts, pendingProducts, approvedProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { approvalStatus: "PENDING_APPROVAL" } }),
      prisma.product.count({ where: { approvalStatus: "APPROVED" } }),
    ]);

    // Order stats
    const [totalOrders, pendingOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          orderStatus: {
            in: ["ORDERED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"],
          },
        },
      }),
    ]);

    // Revenue stats
    const revenueData = await prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayRevenueData = await prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startOfDay },
      },
      _sum: { total: true },
    });

    // Review stats
    const pendingReviews = await prisma.review.count({
      where: { status: "PENDING" },
    });

    const pendingReturns = await prisma.returnRequest.count({
      where: { status: "PENDING" },
    });

    // Coupon stats
    const activeCoupons = await prisma.coupon.count({
      where: { isActive: true },
    });

    // Category stats
    const totalCategories = await prisma.category.count();

    const [commissionAgg, pendingPayoutAgg] = await Promise.all([
      prisma.sellerEarning.aggregate({
        _sum: { commissionAmount: true },
      }),
      prisma.sellerEarning.aggregate({
        where: { status: "AVAILABLE" },
        _sum: { netAmount: true },
      }),
    ]);

    return {
      totalUsers,
      totalCustomers,
      totalSellers,
      pendingSellers,
      totalProducts,
      pendingProducts,
      approvedProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: Number(revenueData._sum.total || 0),
      todayRevenue: Number(todayRevenueData._sum.total || 0),
      pendingReviews,
      pendingReturns,
      activeCoupons,
      totalCategories,
      commissionEarned: Number(commissionAgg._sum.commissionAmount || 0),
      pendingPayouts: Number(pendingPayoutAgg._sum.netAmount || 0),
    };
  } catch (error) {
    console.error("Get admin stats error:", error);
    return {
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
      pendingReturns: 0,
      activeCoupons: 0,
      totalCategories: 0,
      commissionEarned: 0,
      pendingPayouts: 0,
    };
  }
}

export async function getRecentActivity(limit: number = 10) {
  try {
    await requireAdmin();

    // Get recent orders, users, and products
    const [recentOrders, recentUsers, recentProducts] = await Promise.all([
      prisma.order.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.user.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        where: { approvalStatus: "PENDING_APPROVAL" },
        select: {
          id: true,
          name: true,
          thumbnail: true,
          createdAt: true,
          seller: {
            select: {
              businessName: true,
            },
          },
        },
      }),
    ]);

    return {
      recentOrders,
      recentUsers,
      recentProducts,
    };
  } catch (error) {
    console.error("Get recent activity error:", error);
    return {
      recentOrders: [],
      recentUsers: [],
      recentProducts: [],
    };
  }
}

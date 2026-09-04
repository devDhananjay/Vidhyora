"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";

export type SellerStats = {
  totalProducts: number;
  activeProducts: number;
  pendingApproval: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  lowStockProducts: number;
  totalReturns: number;
  pendingReturns: number;
  availablePayout: number;
  commissionDeducted: number;
};

export async function getSellerStats(): Promise<SellerStats> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      throw new Error("Seller profile not found");
    }

    const sellerUserId = acting.sellerUserId;

    // Get product stats
    const [
      totalProducts,
      activeProducts,
      pendingApproval,
      lowStockProducts,
    ] = await Promise.all([
      prisma.product.count({
        where: { sellerId: sellerUserId },
      }),
      prisma.product.count({
        where: {
          sellerId: sellerUserId,
          status: "ACTIVE",
          approvalStatus: "APPROVED",
        },
      }),
      prisma.product.count({
        where: {
          sellerId: sellerUserId,
          approvalStatus: "PENDING_APPROVAL",
        },
      }),
      prisma.productVariant.count({
        where: {
          product: { sellerId: sellerUserId },
          stock: { lte: 10 },
          isActive: true,
        },
      }),
    ]);

    // Get order stats
    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      prisma.orderItem.count({
        where: { sellerId: sellerUserId },
      }),
      prisma.orderItem.count({
        where: {
          sellerId: sellerUserId,
          order: {
            orderStatus: {
              in: ["ORDERED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"],
            },
          },
        },
      }),
      prisma.orderItem.count({
        where: {
          sellerId: sellerUserId,
          order: { orderStatus: "DELIVERED" },
        },
      }),
    ]);

    // Get revenue stats
    const revenueData = await prisma.orderItem.aggregate({
      where: {
        sellerId: sellerUserId,
        order: { paymentStatus: "PAID" },
      },
      _sum: { total: true },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthRevenueData = await prisma.orderItem.aggregate({
      where: {
        sellerId: sellerUserId,
        order: {
          paymentStatus: "PAID",
          createdAt: { gte: startOfMonth },
        },
      },
      _sum: { total: true },
    });

    // Get return stats
    const [totalReturns, pendingReturns, availablePayoutAgg, commissionAgg] = await Promise.all([
      prisma.returnRequest.count({
        where: {
          orderItem: { sellerId: sellerUserId },
        },
      }),
      prisma.returnRequest.count({
        where: {
          status: "PENDING",
          orderItem: { sellerId: sellerUserId },
        },
      }),
      prisma.sellerEarning.aggregate({
        where: { sellerId: sellerUserId, status: "AVAILABLE" },
        _sum: { netAmount: true },
      }),
      prisma.sellerEarning.aggregate({
        where: { sellerId: sellerUserId },
        _sum: { commissionAmount: true },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      pendingApproval,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: Number(revenueData._sum.total || 0),
      thisMonthRevenue: Number(thisMonthRevenueData._sum.total || 0),
      lowStockProducts,
      totalReturns,
      pendingReturns,
      availablePayout: Number(availablePayoutAgg._sum.netAmount || 0),
      commissionDeducted: Number(commissionAgg._sum.commissionAmount || 0),
    };
  } catch (error) {
    console.error("Get seller stats error:", error);
    return {
      totalProducts: 0,
      activeProducts: 0,
      pendingApproval: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      thisMonthRevenue: 0,
      lowStockProducts: 0,
      totalReturns: 0,
      pendingReturns: 0,
      availablePayout: 0,
      commissionDeducted: 0,
    };
  }
}

export async function getRecentOrders(limit: number = 5) {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return [];
    }

    const orders = await prisma.orderItem.findMany({
      where: { sellerId: acting.sellerUserId },
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
            thumbnail: true,
            slug: true,
          },
        },
        variant: {
          select: {
            sku: true,
          },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
      take: limit,
    });

    return orders;
  } catch (error) {
    console.error("Get recent orders error:", error);
    return [];
  }
}

export async function getLowStockProducts(limit: number = 5) {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: acting.sellerUserId,
        status: "ACTIVE",
      },
      include: {
        variants: {
          where: {
            stock: { lte: 10 },
            isActive: true,
          },
          orderBy: { stock: "asc" },
          take: 1,
        },
      },
      take: limit,
    });

    return products.filter((p) => p.variants.length > 0);
  } catch (error) {
    console.error("Get low stock products error:", error);
    return [];
  }
}

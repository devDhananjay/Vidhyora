"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";

export async function getSellerOrders(filters?: {
  status?: string;
  search?: string;
}) {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return [];
    }

    const where: any = {
      sellerId: acting.sellerUserId,
    };

    if (filters?.status) {
      where.order = {
        orderStatus: filters.status,
      };
    }

    if (filters?.search) {
      where.order = {
        ...where.order,
        orderNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      };
    }

    const orderItems = await prisma.orderItem.findMany({
      where,
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
            attributes: true,
          },
        },
      },
      orderBy: {
        order: {
          createdAt: "desc",
        },
      },
    });

    return orderItems;
  } catch (error) {
    console.error("Get seller orders error:", error);
    return [];
  }
}

export async function getSellerOrderById(orderItemId: string) {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return null;
    }

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: orderItemId,
        sellerId: acting.sellerUserId,
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
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
            attributes: true,
          },
        },
      },
    });

    return orderItem;
  } catch (error) {
    console.error("Get seller order by ID error:", error);
    return null;
  }
}

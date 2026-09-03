"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";

export async function getSellerProducts(filters?: {
  status?: string;
  approvalStatus?: string;
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
      where.status = filters.status;
    }

    if (filters?.approvalStatus) {
      where.approvalStatus = filters.approvalStatus;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            stock: true,
            price: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return products;
  } catch (error) {
    console.error("Get seller products error:", error);
    return [];
  }
}

export async function getProductById(productId: string) {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return null;
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: acting.sellerUserId,
      },
      include: {
        category: true,
        variants: {
          orderBy: { price: "asc" },
        },
        images: {
          orderBy: { sortOrder: "asc" },
        },
        policy: true,
      },
    });

    return product;
  } catch (error) {
    console.error("Get product by ID error:", error);
    return null;
  }
}

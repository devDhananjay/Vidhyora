"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";

export async function getSellerReturns() {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return [];
    }

    return prisma.returnRequest.findMany({
      where: {
        orderItem: {
          sellerId: acting.sellerUserId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        orderItem: {
          include: {
            product: {
              select: {
                name: true,
                thumbnail: true,
                seller: {
                  select: { businessName: true },
                },
              },
            },
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });
  } catch (error) {
    console.error("Get seller returns error:", error);
    return [];
  }
}

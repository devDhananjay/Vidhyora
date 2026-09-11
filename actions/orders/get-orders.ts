"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { OrderWithDetails } from "@/types/order";

const productListSelect = {
  id: true,
  name: true,
  slug: true,
  thumbnail: true,
} as const;

const variantListSelect = {
  id: true,
  sku: true,
  attributes: true,
  price: true,
} as const;

export async function getUserOrders(
  search?: string,
): Promise<OrderWithDetails[]> {
  try {
    const session = await requireAuth();
    const q = search?.trim();

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                {
                  items: {
                    some: {
                      productName: { contains: q, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        updatedAt: true,
        orderStatus: true,
        paymentStatus: true,
        total: true,
        subtotal: true,
        discount: true,
        shippingFee: true,
        tax: true,
        giftPackagingFee: true,
        shippingAddress: true,
        billingAddress: true,
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            productName: true,
            quantity: true,
            price: true,
            total: true,
            product: { select: productListSelect },
            variant: { select: variantListSelect },
            reviews: { select: { id: true } },
            returnRequests: {
              orderBy: { requestedAt: "desc" },
              take: 1,
              select: {
                id: true,
                status: true,
                type: true,
                reason: true,
                adminNote: true,
                rejectedAt: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
          },
        },
        shipments: {
          select: {
            id: true,
            trackingNumber: true,
            courier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return orders as unknown as OrderWithDetails[];
  } catch (error) {
    console.error("Get user orders error:", error);
    return [];
  }
}

export async function getOrderById(
  orderId: string,
): Promise<OrderWithDetails | null> {
  try {
    const session = await requireAuth();

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                attributes: true,
                price: true,
              },
            },
            reviews: { select: { id: true } },
            returnRequests: {
              orderBy: { requestedAt: "desc" },
              select: {
                id: true,
                status: true,
                type: true,
                reason: true,
                adminNote: true,
                rejectedAt: true,
                requestedAt: true,
              },
            },
          },
        },
        payments: true,
        shipments: true,
      },
    });

    return order as unknown as OrderWithDetails | null;
  } catch (error) {
    console.error("Get order by ID error:", error);
    return null;
  }
}

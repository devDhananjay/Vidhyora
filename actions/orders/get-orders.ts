"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { OrderWithDetails } from "@/types/order";

export async function getUserOrders(): Promise<OrderWithDetails[]> {
  try {
    const session = await requireAuth();

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            reviews: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders as OrderWithDetails[];
  } catch (error) {
    console.error("Get user orders error:", error);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
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
            product: true,
            variant: true,
            reviews: true,
          },
        },
        payments: true,
      },
    });

    return order as OrderWithDetails | null;
  } catch (error) {
    console.error("Get order by ID error:", error);
    return null;
  }
}

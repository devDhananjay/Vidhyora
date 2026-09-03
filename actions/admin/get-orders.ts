"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getAllOrders() {
  try {
    await requireAdmin();

    return prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                thumbnail: true,
                slug: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    return [];
  }
}

export async function getAdminOrderById(orderId: string) {
  try {
    await requireAdmin();

    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                thumbnail: true,
                slug: true,
              },
            },
          },
        },
        payments: true,
        shipments: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Get admin order by ID error:", error);
    return null;
  }
}

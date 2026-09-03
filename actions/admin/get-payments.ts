"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getAllPayments() {
  try {
    await requireAdmin();

    return prisma.payment.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            paymentStatus: true,
            orderStatus: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    return [];
  }
}

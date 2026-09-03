"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getAllUsers(filters?: {
  role?: string;
  search?: string;
}) {
  try {
    await requireAdmin();

    const where: any = {};

    if (filters?.role && filters.role !== "ALL") {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
        sellerProfile: {
          select: {
            businessName: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users;
  } catch (error) {
    console.error("Get all users error:", error);
    return [];
  }
}

export async function getUserById(userId: string) {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sellerProfile: true,
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Get user by ID error:", error);
    return null;
  }
}

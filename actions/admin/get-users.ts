"use server";

import type { Prisma, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export type AdminUserListFilters = {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getAllUsers(filters?: AdminUserListFilters) {
  try {
    await requireAdmin();

    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.min(50, Math.max(10, filters?.pageSize ?? 20));
    const where: Prisma.UserWhereInput = {};

    if (filters?.role && filters.role !== "ALL") {
      where.role = filters.role as UserRole;
    }

    if (filters?.status === "ACTIVE") {
      where.isActive = true;
    } else if (filters?.status === "INACTIVE") {
      where.isActive = false;
    }

    const search = filters?.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true,
              reviews: true,
              addresses: true,
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    console.error("Get all users error:", error);
    return {
      users: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
  }
}

export async function getUserById(userId: string) {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sellerProfile: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        },
        orders: {
          take: 20,
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

export async function getUserManagementStats() {
  try {
    await requireAdmin();
    const [total, active, inactive, customers, sellers, admins] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: "SELLER" } }),
        prisma.user.count({
          where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        }),
      ]);

    return { total, active, inactive, customers, sellers, admins };
  } catch (error) {
    console.error("getUserManagementStats error:", error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      customers: 0,
      sellers: 0,
      admins: 0,
    };
  }
}

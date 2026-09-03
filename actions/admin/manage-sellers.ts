"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

export async function getAllSellers(filters?: {
  status?: string;
  search?: string;
}) {
  try {
    await requireAdmin();

    const where: any = {};

    if (filters?.status && filters.status !== "ALL") {
      where.verificationStatus = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { businessEmail: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const sellers = await prisma.sellerProfile.findMany({
      where,
      include: {
        seller: {
          select: {
            name: true,
            email: true,
            createdAt: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sellers;
  } catch (error) {
    console.error("Get all sellers error:", error);
    return [];
  }
}

export async function getSellerById(sellerId: string) {
  try {
    await requireAdmin();

    const seller = await prisma.sellerProfile.findUnique({
      where: { sellerId },
      include: {
        seller: true,
        products: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return seller;
  } catch (error) {
    console.error("Get seller by ID error:", error);
    return null;
  }
}

export async function approveSeller(
  sellerId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { sellerId },
        data: {
          verificationStatus: "APPROVED",
          rejectionReason: null,
        },
      }),
      prisma.user.update({
        where: { id: sellerId },
        data: { isActive: true },
      }),
    ]);

    revalidatePath("/admin/sellers");
    revalidatePath(`/admin/sellers/${sellerId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Approve seller error:", error);
    return {
      success: false,
      error: "Failed to approve seller",
    };
  }
}

export async function rejectSeller(
  sellerId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.sellerProfile.update({
      where: { sellerId },
      data: {
        verificationStatus: "REJECTED",
        rejectionReason: reason,
      },
    });

    revalidatePath("/admin/sellers");
    revalidatePath(`/admin/sellers/${sellerId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Reject seller error:", error);
    return {
      success: false,
      error: "Failed to reject seller",
    };
  }
}

export async function suspendSeller(
  sellerId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { sellerId },
        data: {
          verificationStatus: "SUSPENDED",
          rejectionReason: reason,
        },
      }),
      prisma.user.update({
        where: { id: sellerId },
        data: { isActive: false },
      }),
    ]);

    revalidatePath("/admin/sellers");
    revalidatePath(`/admin/sellers/${sellerId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Suspend seller error:", error);
    return {
      success: false,
      error: "Failed to suspend seller",
    };
  }
}

export async function reactivateSeller(
  sellerId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.$transaction([
      prisma.sellerProfile.update({
        where: { sellerId },
        data: {
          verificationStatus: "APPROVED",
          rejectionReason: null,
        },
      }),
      prisma.user.update({
        where: { id: sellerId },
        data: { isActive: true },
      }),
    ]);

    revalidatePath("/admin/sellers");
    revalidatePath(`/admin/sellers/${sellerId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Reactivate seller error:", error);
    return {
      success: false,
      error: "Failed to activate seller",
    };
  }
}

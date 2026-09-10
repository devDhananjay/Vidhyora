"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { notifyProductApproved, notifyProductRejected } from "@/lib/email/transactional";
import type { ActionResult } from "@/lib/utils";

export async function getAdminProductById(productId: string) {
  try {
    await requireAdmin();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        seller: {
          include: {
            seller: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
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
    console.error("Get admin product by ID error:", error);
    return null;
  }
}

export async function getAllProducts(filters?: {
  approvalStatus?: string;
  search?: string;
}) {
  try {
    await requireAdmin();

    const where: any = {};

    if (filters?.approvalStatus && filters.approvalStatus !== "ALL") {
      where.approvalStatus = filters.approvalStatus;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        {
          variants: {
            some: { sku: { contains: filters.search, mode: "insensitive" } },
          },
        },
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
        seller: {
          include: {
            seller: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        variants: {
          select: {
            stock: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return products;
  } catch (error) {
    console.error("Get all products error:", error);
    return [];
  }
}

export async function approveProduct(
  productId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: "APPROVED",
        status: "ACTIVE",
      },
    });

    void notifyProductApproved(productId).catch((error) =>
      console.error("Product approve email failed:", error),
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Approve product error:", error);
    return {
      success: false,
      error: "Failed to approve product",
    };
  }
}

export async function rejectProduct(
  productId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: "REJECTED",
        status: "INACTIVE",
        rejectionReason: reason,
      },
    });

    // TODO removed — email seller on rejection
    void notifyProductRejected(productId, reason).catch((error) =>
      console.error("Product reject email failed:", error),
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Reject product error:", error);
    return {
      success: false,
      error: "Failed to reject product",
    };
  }
}

export async function suspendProduct(
  productId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: "SUSPENDED",
        status: "INACTIVE",
        rejectionReason: reason,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Suspend product error:", error);
    return {
      success: false,
      error: "Failed to suspend product",
    };
  }
}

export async function activateProduct(
  productId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: "APPROVED",
        status: "ACTIVE",
        rejectionReason: null,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Activate product error:", error);
    return {
      success: false,
      error: "Failed to activate product",
    };
  }
}

export async function bulkApproveProducts(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin();

    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return { success: false, error: "No products selected" };
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: uniqueIds } },
      data: {
        approvalStatus: "APPROVED",
        status: "ACTIVE",
        rejectionReason: null,
      },
    });

    for (const id of uniqueIds) {
      void notifyProductApproved(id).catch((error) =>
        console.error("Product approve email failed:", error),
      );
      revalidatePath(`/admin/products/${id}`);
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return {
      success: true,
      data: { count: result.count },
    };
  } catch (error) {
    console.error("Bulk approve products error:", error);
    return {
      success: false,
      error: "Failed to approve products",
    };
  }
}

export async function bulkRejectProducts(
  ids: string[],
  reason: string,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin();

    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const trimmedReason = reason.trim();
    if (uniqueIds.length === 0) {
      return { success: false, error: "No products selected" };
    }
    if (!trimmedReason) {
      return { success: false, error: "Rejection reason is required" };
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: uniqueIds } },
      data: {
        approvalStatus: "REJECTED",
        status: "INACTIVE",
        rejectionReason: trimmedReason,
      },
    });

    for (const id of uniqueIds) {
      void notifyProductRejected(id, trimmedReason).catch((error) =>
        console.error("Product reject email failed:", error),
      );
      revalidatePath(`/admin/products/${id}`);
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return {
      success: true,
      data: { count: result.count },
    };
  } catch (error) {
    console.error("Bulk reject products error:", error);
    return {
      success: false,
      error: "Failed to reject products",
    };
  }
}

"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { z } from "zod";

const updateStockSchema = z.object({
  variantId: z.string(),
  stock: z.number().int().min(0),
});

export async function getAdminInventory() {
  try {
    await requireAdmin();

    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        seller: {
          select: {
            businessName: true,
            seller: { select: { email: true } },
          },
        },
        variants: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            sku: true,
            stock: true,
            reservedStock: true,
            isActive: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return products.map((product) => {
      const totalStock = product.variants.reduce((sum, row) => sum + row.stock, 0);
      const totalReserved = product.variants.reduce(
        (sum, row) => sum + row.reservedStock,
        0,
      );
      return {
        id: product.id,
        name: product.name,
        thumbnail: product.thumbnail,
        status: product.status,
        approvalStatus: product.approvalStatus,
        categoryName: product.category.name,
        sellerName: product.seller.businessName,
        sellerEmail: product.seller.seller.email,
        totalStock,
        totalReserved,
        availableStock: totalStock - totalReserved,
        isLowStock: totalStock - totalReserved <= 10,
        variants: product.variants,
      };
    });
  } catch (error) {
    console.error("Get admin inventory error:", error);
    return [];
  }
}

export async function updateAdminVariantStock(
  variantId: string,
  stock: number,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const validated = updateStockSchema.parse({ variantId, stock });

    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.variantId },
      select: { id: true, productId: true },
    });
    if (!variant) {
      return { success: false, error: "Variant not found" };
    }

    await prisma.productVariant.update({
      where: { id: validated.variantId },
      data: { stock: validated.stock },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${variant.productId}`);
    revalidatePath("/seller/inventory");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update admin stock error:", error);
    return { success: false, error: "Failed to update stock" };
  }
}

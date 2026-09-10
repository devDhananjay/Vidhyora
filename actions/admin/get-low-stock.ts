"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { notifyLowStockIfNeeded } from "@/lib/email/transactional";
import type { ActionResult } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  type LowStockVariant,
} from "@/lib/inventory/low-stock";

export async function getLowStockVariants(
  threshold = DEFAULT_LOW_STOCK_THRESHOLD,
): Promise<LowStockVariant[]> {
  try {
    await requireAdmin();

    const variants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: threshold },
        product: {
          approvalStatus: "APPROVED",
        },
      },
      select: {
        id: true,
        sku: true,
        stock: true,
        reservedStock: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            seller: {
              select: {
                sellerId: true,
                businessName: true,
                seller: { select: { email: true } },
              },
            },
          },
        },
      },
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
    });

    return variants.map((variant) => ({
      variantId: variant.id,
      sku: variant.sku,
      stock: variant.stock,
      reservedStock: variant.reservedStock,
      available: variant.stock - variant.reservedStock,
      productId: variant.product.id,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      sellerId: variant.product.seller.sellerId,
      sellerName: variant.product.seller.businessName,
      sellerEmail: variant.product.seller.seller.email,
    }));
  } catch (error) {
    console.error("Get low stock variants error:", error);
    return [];
  }
}

export async function notifySellersLowStock(
  threshold = DEFAULT_LOW_STOCK_THRESHOLD,
): Promise<ActionResult<{ notified: number }>> {
  try {
    await requireAdmin();
    const rows = await getLowStockVariants(threshold);

    const bySellerProduct = new Map<
      string,
      { sellerId: string; productName: string; available: number }
    >();

    for (const row of rows) {
      const key = `${row.sellerId}:${row.productId}`;
      const existing = bySellerProduct.get(key);
      if (!existing || row.available < existing.available) {
        bySellerProduct.set(key, {
          sellerId: row.sellerId,
          productName: row.productName,
          available: row.available,
        });
      }
    }

    let notified = 0;
    for (const entry of bySellerProduct.values()) {
      await notifyLowStockIfNeeded(
        entry.sellerId,
        entry.productName,
        entry.available,
      );
      notified += 1;
    }

    revalidatePath("/admin/inventory");

    return { success: true, data: { notified } };
  } catch (error) {
    console.error("Notify sellers low stock error:", error);
    return {
      success: false,
      error: "Failed to notify sellers",
    };
  }
}

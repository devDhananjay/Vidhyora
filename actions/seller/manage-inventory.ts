"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { z } from "zod";

const updateStockSchema = z.object({
  variantId: z.string(),
  stock: z.number().int().min(0),
});

export async function updateVariantStock(
  variantId: string,
  stock: number,
): Promise<ActionResult<void>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return {
        success: false,
        error: "Seller profile not found",
      };
    }

    // Validate input
    const validated = updateStockSchema.parse({ variantId, stock });

    // Check if variant belongs to seller
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: validated.variantId,
        product: {
          seller: {
            sellerId: acting.sellerUserId,
          },
        },
      },
    });

    if (!variant) {
      return {
        success: false,
        error: "Variant not found or you don't have permission to update it",
      };
    }

    // Update stock
    await prisma.productVariant.update({
      where: { id: validated.variantId },
      data: { stock: validated.stock },
    });

    revalidatePath("/seller/inventory");
    revalidatePath(`/seller/products/${variant.productId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Update variant stock error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update stock",
    };
  }
}

export async function getSellerInventory() {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        seller: {
          sellerId: acting.sellerUserId,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        variants: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate inventory metrics
    const inventory = products.map((product) => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      const totalReserved = product.variants.reduce((sum, v) => sum + v.reservedStock, 0);
      const availableStock = totalStock - totalReserved;
      const lowStockVariants = product.variants.filter((v) => v.stock - v.reservedStock <= 10);

      return {
        ...product,
        totalStock,
        totalReserved,
        availableStock,
        lowStockVariants,
        isLowStock: availableStock <= 10,
      };
    });

    return inventory;
  } catch (error) {
    console.error("Get seller inventory error:", error);
    return [];
  }
}

export async function bulkUpdateStock(
  updates: Array<{ variantId: string; stock: number }>,
): Promise<ActionResult<void>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return {
        success: false,
        error: "Seller profile not found",
      };
    }

    // Validate all updates
    const validated = updates.map((update) => updateStockSchema.parse(update));

    // Get all variant IDs
    const variantIds = validated.map((u) => u.variantId);

    // Verify all variants belong to seller
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: {
          seller: {
            sellerId: acting.sellerUserId,
          },
        },
      },
      select: { id: true },
    });

    if (variants.length !== validated.length) {
      return {
        success: false,
        error: "Some variants not found or you don't have permission to update them",
      };
    }

    // Perform bulk update using transaction
    await prisma.$transaction(
      validated.map((update) =>
        prisma.productVariant.update({
          where: { id: update.variantId },
          data: { stock: update.stock },
        }),
      ),
    );

    revalidatePath("/seller/inventory");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Bulk update stock error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update stock",
    };
  }
}

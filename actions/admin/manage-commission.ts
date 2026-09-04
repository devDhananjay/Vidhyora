"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { DEFAULT_COMMISSION_PERCENTAGE } from "@/lib/commission";

function parseRate(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return null;
  return rate;
}

function toRate(value: unknown): number | null {
  if (value == null) return null;
  const rate = Number(value);
  return Number.isFinite(rate) ? rate : null;
}

async function loadCategoryRates() {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; commissionPercentage: unknown }>
    >`SELECT id, "commissionPercentage" FROM "Category"`;
    return new Map(
      rows.map((row) => [row.id, toRate(row.commissionPercentage)]),
    );
  } catch (error) {
    console.error("Load category rates error:", error);
    return new Map<string, number | null>();
  }
}

async function loadSellerRates() {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ sellerId: string; commissionPercentage: unknown }>
    >`SELECT "sellerId", "commissionPercentage" FROM "SellerProfile"`;
    return new Map(
      rows.map((row) => [
        row.sellerId,
        toRate(row.commissionPercentage) ?? DEFAULT_COMMISSION_PERCENTAGE,
      ]),
    );
  } catch (error) {
    console.error("Load seller rates error:", error);
    return new Map<string, number>();
  }
}

export async function updateSellerCommission(
  sellerId: string,
  rate: unknown,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const parsed = parseRate(rate);
    if (parsed == null) {
      return {
        success: false,
        error: "Commission must be a number between 0 and 100",
      };
    }

    try {
      await prisma.sellerProfile.update({
        where: { sellerId },
        data: { commissionPercentage: parsed },
      });
    } catch {
      await prisma.$executeRaw`
        UPDATE "SellerProfile"
        SET "commissionPercentage" = ${parsed}, "updatedAt" = NOW()
        WHERE "sellerId" = ${sellerId}
      `;
    }

    revalidatePath("/admin/sellers");
    revalidatePath(`/admin/sellers/${sellerId}`);
    revalidatePath("/admin/payouts");
    revalidatePath("/admin/settings");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update seller commission error:", error);
    return { success: false, error: "Failed to update seller commission" };
  }
}

export async function updateCategoryCommission(
  categoryId: string,
  rate: unknown,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    if (rate === "" || rate == null) {
      try {
        await prisma.category.update({
          where: { id: categoryId },
          data: { commissionPercentage: null },
        });
      } catch {
        await prisma.$executeRaw`
          UPDATE "Category"
          SET "commissionPercentage" = NULL, "updatedAt" = NOW()
          WHERE id = ${categoryId}
        `;
      }
    } else {
      const parsed = parseRate(rate);
      if (parsed == null) {
        return {
          success: false,
          error: "Commission must be a number between 0 and 100, or empty",
        };
      }
      try {
        await prisma.category.update({
          where: { id: categoryId },
          data: { commissionPercentage: parsed },
        });
      } catch {
        await prisma.$executeRaw`
          UPDATE "Category"
          SET "commissionPercentage" = ${parsed}, "updatedAt" = NOW()
          WHERE id = ${categoryId}
        `;
      }
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/settings");
    revalidatePath(`/admin/categories/${categoryId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update category commission error:", error);
    return { success: false, error: "Failed to update category commission" };
  }
}

export async function getCommissionSettings() {
  try {
    await requireAdmin();

    const [categories, sellers, categoryRates, sellerRates] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        select: {
          id: true,
          name: true,
          slug: true,
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.sellerProfile.findMany({
        select: {
          sellerId: true,
          businessName: true,
          seller: { select: { email: true } },
        },
        orderBy: { businessName: "asc" },
      }),
      loadCategoryRates(),
      loadSellerRates(),
    ]);

    return {
      defaultRate: DEFAULT_COMMISSION_PERCENTAGE,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        commissionPercentage: categoryRates.get(category.id) ?? null,
        children: category.children.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          commissionPercentage: categoryRates.get(child.id) ?? null,
        })),
      })),
      sellers: sellers.map((seller) => ({
        sellerId: seller.sellerId,
        businessName: seller.businessName,
        seller: seller.seller,
        commissionPercentage:
          sellerRates.get(seller.sellerId) ?? DEFAULT_COMMISSION_PERCENTAGE,
      })),
    };
  } catch (error) {
    console.error("Get commission settings error:", error);
    return {
      defaultRate: DEFAULT_COMMISSION_PERCENTAGE,
      categories: [],
      sellers: [],
    };
  }
}

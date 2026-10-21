"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import type { MeeshoListingStatus } from "@prisma/client";
import {
  enqueueMeeshoListingForProduct,
  enqueueMeeshoListingsForProducts,
} from "@/lib/meesho/enqueue";
import {
  rowsToCsv,
  type MeeshoMappedRow,
} from "@/lib/meesho/map-product";

export type MeeshoListingRow = {
  id: string;
  productId: string;
  sku: string;
  status: MeeshoListingStatus;
  meeshoCategory: string | null;
  groupId: string | null;
  errorMessage: string | null;
  meeshoCatalogId: string | null;
  uploadedAt: Date | null;
  liveAt: Date | null;
  createdAt: Date;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  sitePrice: number;
};

export async function getMeeshoListings(opts?: {
  status?: MeeshoListingStatus | "ALL";
}): Promise<MeeshoListingRow[]> {
  await requireAdmin();
  const status = opts?.status && opts.status !== "ALL" ? opts.status : undefined;

  const rows = await prisma.meeshoListing.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      product: {
        select: {
          name: true,
          slug: true,
          thumbnail: true,
          basePrice: true,
        },
      },
    },
    take: 200,
  });

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    status: row.status,
    meeshoCategory: row.meeshoCategory,
    groupId: row.groupId,
    errorMessage: row.errorMessage,
    meeshoCatalogId: row.meeshoCatalogId,
    uploadedAt: row.uploadedAt,
    liveAt: row.liveAt,
    createdAt: row.createdAt,
    productName: row.product.name,
    productSlug: row.product.slug,
    thumbnail: row.product.thumbnail,
    sitePrice: Number(row.product.basePrice),
  }));
}

export async function getMeeshoListingStats() {
  await requireAdmin();
  const groups = await prisma.meeshoListing.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

export async function rebuildMeeshoListing(
  productId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const result = await enqueueMeeshoListingForProduct(productId);
    revalidatePath("/admin/meesho");
    if (!result.ok) {
      return { success: false, error: result.error || "Rebuild failed" };
    }
    return { success: true, data: undefined };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to rebuild Meesho listing" };
  }
}

export async function syncApprovedProductsToMeeshoQueue(): Promise<
  ActionResult<{ queued: number }>
> {
  try {
    await requireAdmin();
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        approvalStatus: "APPROVED",
        OR: [
          { meeshoListing: null },
          { meeshoListing: { status: { in: ["FAILED", "SKIPPED", "PENDING"] } } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    await enqueueMeeshoListingsForProducts(products.map((p) => p.id));
    revalidatePath("/admin/meesho");
    return { success: true, data: { queued: products.length } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to sync queue" };
  }
}

export async function markMeeshoListingsUploaded(
  ids: string[],
  meeshoCatalogId?: string,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin();
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) {
      return { success: false, error: "No listings selected" };
    }
    const result = await prisma.meeshoListing.updateMany({
      where: { id: { in: unique } },
      data: {
        status: "UPLOADED",
        uploadedAt: new Date(),
        meeshoCatalogId: meeshoCatalogId?.trim() || undefined,
        errorMessage: null,
      },
    });
    revalidatePath("/admin/meesho");
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to mark uploaded" };
  }
}

export async function markMeeshoListingsLive(
  ids: string[],
  meeshoCatalogId?: string,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin();
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) {
      return { success: false, error: "No listings selected" };
    }
    const result = await prisma.meeshoListing.updateMany({
      where: { id: { in: unique } },
      data: {
        status: "LIVE",
        liveAt: new Date(),
        uploadedAt: new Date(),
        meeshoCatalogId: meeshoCatalogId?.trim() || undefined,
        errorMessage: null,
      },
    });
    revalidatePath("/admin/meesho");
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to mark live" };
  }
}

export async function buildMeeshoCsvForCategory(
  meeshoCategory: string,
): Promise<ActionResult<{ csv: string; filename: string; count: number }>> {
  try {
    await requireAdmin();
    const rows = await prisma.meeshoListing.findMany({
      where: {
        meeshoCategory,
        status: { in: ["READY", "PENDING"] },
      },
      orderBy: { createdAt: "asc" },
      take: 90,
    });

    const payloads = rows
      .map((r) => r.payload as MeeshoMappedRow | null)
      .filter((p): p is MeeshoMappedRow => Boolean(p?.sku && p?.image1));

    if (!payloads.length) {
      return {
        success: false,
        error: `No READY rows for ${meeshoCategory}`,
      };
    }

    const csv = rowsToCsv(payloads);
    const safe = meeshoCategory.replace(/[^A-Za-z0-9]+/g, "_");
    return {
      success: true,
      data: {
        csv,
        filename: `VIDYORA_Meesho_${safe}_${payloads.length}.csv`,
        count: payloads.length,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to build CSV" };
  }
}

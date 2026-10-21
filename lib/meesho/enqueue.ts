import prisma from "@/lib/prisma";
import {
  MEESHO_MAX_SKUS_PER_CATALOG,
  mapCategorySlugToMeesho,
} from "@/lib/meesho/categories";
import { mapProductToMeeshoRow } from "@/lib/meesho/map-product";

function groupIdFor(categoryKey: string, bucket: number) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `VDY-${categoryKey.replace(/[^A-Za-z0-9]+/g, "").slice(0, 12).toUpperCase()}-${stamp}-${bucket}`;
}

/**
 * Enqueue / refresh Meesho listing when a product goes live on the website.
 * Does NOT push to Meesho API (partner credentials required for full auto).
 * Builds a Meesho-safe payload ready for bulk Excel/CSV upload.
 */
export async function enqueueMeeshoListingForProduct(
  productId: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (process.env.MEESHO_SYNC_ENABLED === "false") {
    return { ok: true, skipped: true };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { slug: true, name: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, sortOrder: true, kind: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
        meeshoListing: true,
      },
    });

    if (!product) {
      return { ok: false, error: "Product not found" };
    }

    if (product.status !== "ACTIVE" || product.approvalStatus !== "APPROVED") {
      return { ok: true, skipped: true };
    }

    const meeshoCategory = mapCategorySlugToMeesho(product.category.slug);
    if (!meeshoCategory) {
      await prisma.meeshoListing.upsert({
        where: { productId },
        create: {
          productId,
          sku: product.variants[0]?.sku || product.slug,
          status: "SKIPPED",
          errorMessage: `No Meesho category for "${product.category.slug}"`,
        },
        update: {
          status: "SKIPPED",
          errorMessage: `No Meesho category for "${product.category.slug}"`,
        },
      });
      return { ok: true, skipped: true };
    }

    const variant = product.variants[0];
    if (!variant) {
      await prisma.meeshoListing.upsert({
        where: { productId },
        create: {
          productId,
          sku: product.slug,
          status: "FAILED",
          meeshoCategory,
          errorMessage: "No active variant / SKU",
        },
        update: {
          status: "FAILED",
          meeshoCategory,
          errorMessage: "No active variant / SKU",
        },
      });
      return { ok: false, error: "No active variant" };
    }

    // Don't overwrite listings already uploaded/live unless forced
    if (
      product.meeshoListing &&
      (product.meeshoListing.status === "UPLOADED" ||
        product.meeshoListing.status === "LIVE")
    ) {
      return { ok: true, skipped: true };
    }

    const pendingSameCategory = await prisma.meeshoListing.count({
      where: {
        meeshoCategory,
        status: { in: ["PENDING", "READY"] },
        productId: { not: productId },
      },
    });
    const bucket = Math.floor(pendingSameCategory / MEESHO_MAX_SKUS_PER_CATALOG) + 1;
    const groupId =
      product.meeshoListing?.groupId || groupIdFor(meeshoCategory, bucket);

    const row = mapProductToMeeshoRow({
      product,
      variant,
      groupId,
    });

    await prisma.meeshoListing.upsert({
      where: { productId },
      create: {
        productId,
        variantId: variant.id,
        sku: variant.sku,
        status: "READY",
        meeshoCategory,
        groupId,
        payload: row,
        errorMessage: null,
      },
      update: {
        variantId: variant.id,
        sku: variant.sku,
        status: "READY",
        meeshoCategory,
        groupId,
        payload: row,
        errorMessage: null,
      },
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("enqueueMeeshoListingForProduct:", message);
    try {
      await prisma.meeshoListing.upsert({
        where: { productId },
        create: {
          productId,
          sku: "unknown",
          status: "FAILED",
          errorMessage: message,
        },
        update: {
          status: "FAILED",
          errorMessage: message,
        },
      });
    } catch {
      // ignore secondary failure
    }
    return { ok: false, error: message };
  }
}

export async function enqueueMeeshoListingsForProducts(productIds: string[]) {
  const results = [];
  for (const id of productIds) {
    results.push(await enqueueMeeshoListingForProduct(id));
  }
  return results;
}

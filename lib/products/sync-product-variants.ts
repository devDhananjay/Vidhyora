import type { Prisma } from "@prisma/client";

type VariantInput = {
  sku: string;
  attributes?: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  weight?: number;
  dimensions?: Record<string, number>;
  isActive?: boolean;
};

type ImageInput = {
  url: string;
  sourceUrl?: string;
  altText?: string;
  kind?: "IMAGE" | "VIDEO" | string;
  sortOrder: number;
};

function variantWriteData(variant: VariantInput) {
  const dims = variant.dimensions;
  return {
    sku: variant.sku.trim(),
    attributes: variant.attributes ?? {},
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? null,
    stock: variant.stock,
    weight: variant.weight ?? null,
    // Schema has length/width/height — not a `dimensions` JSON field
    length: dims?.length ?? dims?.l ?? null,
    width: dims?.width ?? dims?.w ?? null,
    height: dims?.height ?? dims?.h ?? null,
    isActive: variant.isActive ?? true,
  };
}

/**
 * Replace product images safely (images are not FK-locked by orders).
 */
export async function replaceProductImages(
  tx: Prisma.TransactionClient,
  productId: string,
  images: ImageInput[],
) {
  await tx.productImage.deleteMany({ where: { productId } });
  if (images.length === 0) return;
  await tx.productImage.createMany({
    data: images.map((image, index) => ({
      productId,
      url: image.url,
      sourceUrl: image.sourceUrl || image.url,
      kind: image.kind === "VIDEO" ? "VIDEO" : "IMAGE",
      altText: image.altText,
      sortOrder: image.sortOrder ?? index,
    })),
  });
}

/**
 * Upsert variants by SKU. Never delete variants that are referenced by orders
 * (FK OrderItem_variantId_fkey) — deactivate them instead.
 */
export async function syncProductVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  variants: VariantInput[],
) {
  const existing = await tx.productVariant.findMany({
    where: { productId },
    select: {
      id: true,
      sku: true,
      _count: {
        select: {
          orderItems: true,
          cartItems: true,
          wishlistItems: true,
        },
      },
    },
  });

  const bySku = new Map(existing.map((row) => [row.sku.toLowerCase(), row]));
  const keptIds = new Set<string>();

  for (const variant of variants) {
    const skuKey = variant.sku.trim().toLowerCase();
    const match = bySku.get(skuKey);
    const data = variantWriteData(variant);

    if (match) {
      keptIds.add(match.id);
      await tx.productVariant.update({
        where: { id: match.id },
        data,
      });
    } else {
      const created = await tx.productVariant.create({
        data: {
          productId,
          ...data,
          reservedStock: 0,
        },
      });
      keptIds.add(created.id);
    }
  }

  for (const row of existing) {
    if (keptIds.has(row.id)) continue;
    const referenced =
      row._count.orderItems > 0 ||
      row._count.cartItems > 0 ||
      row._count.wishlistItems > 0;

    if (referenced) {
      await tx.productVariant.update({
        where: { id: row.id },
        data: { isActive: false, stock: 0 },
      });
    } else {
      await tx.productVariant.delete({ where: { id: row.id } });
    }
  }
}

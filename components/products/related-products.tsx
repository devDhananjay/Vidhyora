import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import {
  imageUrlsForProduct,
  jewelleryCardMeta,
  mapCardVariants,
  getProductBadgeSets,
  resolveProductBadge,
} from "@/lib/products/product-card-data";
import { getCartLinesForPlp } from "@/actions/cart/get-cart";

export async function RelatedProducts({
  categoryId,
  currentProductId,
}: {
  categoryId: string;
  currentProductId: string;
}) {
  const [relatedProducts, cartLines, badgeSets] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId,
        id: { not: currentProductId },
        status: "ACTIVE",
        approvalStatus: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        basePrice: true,
        compareAtPrice: true,
        thumbnail: true,
        attributes: true,
        images: {
          select: { url: true },
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            stock: true,
            attributes: true,
          },
          orderBy: { price: "asc" },
        },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    getCartLinesForPlp(),
    getProductBadgeSets(),
  ]);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Related Products</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {relatedProducts.map((product) => (
          <ProductCard
            key={product.id}
            cartLines={cartLines}
            product={{
              ...product,
              basePrice: Number(product.basePrice),
              compareAtPrice: product.compareAtPrice
                ? Number(product.compareAtPrice)
                : null,
              images: imageUrlsForProduct(product),
              badge: resolveProductBadge(product, badgeSets),
              metalLabel: jewelleryCardMeta(product.attributes).label ?? null,
              variants: mapCardVariants(product.variants),
            }}
          />
        ))}
      </div>
    </div>
  );
}

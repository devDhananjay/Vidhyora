import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import {
  imageUrlsForProduct,
  isBestSellerFlag,
} from "@/lib/products/product-card-data";

export async function RelatedProducts({
  categoryId,
  currentProductId,
}: {
  categoryId: string;
  currentProductId: string;
}) {
  const relatedProducts = await prisma.product.findMany({
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
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

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
            product={{
              ...product,
              basePrice: Number(product.basePrice),
              compareAtPrice: product.compareAtPrice
                ? Number(product.compareAtPrice)
                : null,
              images: imageUrlsForProduct(product),
              isBestSeller: isBestSellerFlag(product.attributes),
            }}
          />
        ))}
      </div>
    </div>
  );
}

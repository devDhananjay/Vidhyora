import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import { Pagination } from "@/components/products/pagination";
import { PAGINATION } from "@/lib/constants";
import { getWishlistProductIds } from "@/actions/wishlist/manage-wishlist";
import {
  buildProductWhere,
  getProductOrderBy,
  type ProductListParams,
} from "@/lib/products/product-query";

export async function ProductGrid({
  searchParams,
}: {
  searchParams: Promise<ProductListParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const where = buildProductWhere(params);
  const orderBy = getProductOrderBy(params.sort);

  const [products, total, wishlistIds] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        basePrice: true,
        compareAtPrice: true,
        thumbnail: true,
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    getWishlistProductIds(),
  ]);
  const savedIds = new Set(wishlistIds);

  const totalPages = Math.ceil(total / pageSize);

  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 p-12">
        <div className="text-center">
          <h3 className="mb-2 font-serif text-2xl">No jewellery found</h3>
          <p className="text-sm text-neutral-500">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            isInWishlist={savedIds.has(product.id)}
            product={{
              ...product,
              basePrice: Number(product.basePrice),
              compareAtPrice: product.compareAtPrice
                ? Number(product.compareAtPrice)
                : null,
            }}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}

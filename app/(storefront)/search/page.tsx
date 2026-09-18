import type { Metadata } from "next";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import { Pagination } from "@/components/products/pagination";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import { getWishlistProductIds } from "@/actions/wishlist/manage-wishlist";
import { getCartLinesForPlp } from "@/actions/cart/get-cart";
import {
  buildProductWhere,
  type ProductListParams,
} from "@/lib/products/product-query";
import {
  imageUrlsForProduct,
  isBestSellerFlag,
  jewelleryCardMeta,
  mapCardVariants,
} from "@/lib/products/product-card-data";
import { getProductFacets } from "@/lib/products/product-facets";
import { productSearch } from "@/lib/search/product-search";
import { PAGINATION } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Search Jewellery | VIDYORA",
  description: "Search gold, diamond and fine jewellery on VIDYORA",
};

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<ProductListParams>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1", 10) || 1;
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  const filters = productSearch.filtersFromParams({
    ...params,
    sort:
      query && (!params.sort || params.sort === "default")
        ? "relevance"
        : params.sort,
  });

  const [result, wishlistIds, cartLines] = await Promise.all([
    productSearch.search(query, filters, page, pageSize),
    getWishlistProductIds(),
    getCartLinesForPlp(),
  ]);
  const savedIds = new Set(wishlistIds);

  if (result.items.length === 0) {
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
        {result.items.map((product) => (
          <ProductCard
            key={product.id}
            isInWishlist={savedIds.has(product.id)}
            cartLines={cartLines}
            product={{
              ...product,
              images: imageUrlsForProduct(product),
              isBestSeller: isBestSellerFlag(product.attributes),
              metalLabel: jewelleryCardMeta(product.attributes).label ?? null,
              variants: mapCardVariants(product.variants ?? []),
            }}
          />
        ))}
      </div>

      {result.totalPages > 1 ? (
        <Pagination currentPage={result.page} totalPages={result.totalPages} />
      ) : null}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<ProductListParams>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const [total, facets] = await Promise.all([
    prisma.product.count({ where: buildProductWhere(params) }),
    getProductFacets(),
  ]);

  const title = query ? `Search results for “${query}”` : "Search Jewellery";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-serif text-3xl text-neutral-900 sm:text-4xl">
        {title}{" "}
        <span className="text-base font-sans text-neutral-400 sm:text-lg">
          ({total.toLocaleString("en-IN")} results)
        </span>
      </h1>

      <Suspense fallback={<div className="mb-8 h-11 animate-pulse rounded-full bg-neutral-100" />}>
        <TanishqFilterBar facets={facets} total={total} />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

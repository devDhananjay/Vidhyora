import type { Metadata } from "next";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import {
  buildProductWhere,
  type ProductListParams,
} from "@/lib/products/product-query";
import { getProductFacets } from "@/lib/products/product-facets";

export const metadata: Metadata = {
  title: "Search Jewellery | VIDYORA",
  description: "Search gold, diamond and fine jewellery on VIDYORA",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

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
      <h1 className="mb-6 font-serif text-3xl text-brand sm:text-4xl">
        {title}{" "}
        <span className="text-base font-sans text-neutral-400 sm:text-lg">
          ({total.toLocaleString("en-IN")} results)
        </span>
      </h1>

      <Suspense fallback={<div className="mb-8 h-11 animate-pulse rounded-full bg-neutral-100" />}>
        <TanishqFilterBar facets={facets} total={total} />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

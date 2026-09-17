import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import { getProductFacets } from "@/lib/products/product-facets";
import { buildProductWhere, getListingTitle, type ProductListParams } from "@/lib/products/product-query";

export const metadata: Metadata = {
  title: "All Jewellery",
  description: "Browse gold, diamond and fine jewellery on VIDYORA",
  alternates: {
    canonical: "/products",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductListParams>;
}) {
  const params = await searchParams;
  const [total, facets] = await Promise.all([
    prisma.product.count({ where: buildProductWhere(params) }),
    getProductFacets(),
  ]);

  const title = getListingTitle(params);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/" className="hover:text-[#8b2e2e]">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-800">{title}</span>
      </nav>

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
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

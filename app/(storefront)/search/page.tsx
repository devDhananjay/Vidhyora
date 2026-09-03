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

export const metadata: Metadata = {
  title: "Search Jewellery | VIDYORA",
  description: "Search gold, diamond and fine jewellery on VIDYORA",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<ProductListParams>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const [total, brands] = await Promise.all([
    prisma.product.count({ where: buildProductWhere(params) }),
    prisma.product.findMany({
      where: { status: "ACTIVE", approvalStatus: "APPROVED" },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
  ]);

  const title = query ? `Search results for “${query}”` : "Search Jewellery";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-serif text-4xl text-neutral-900">
        {title}{" "}
        <span className="text-lg font-sans text-neutral-400">
          ({total.toLocaleString("en-IN")} results)
        </span>
      </h1>

      <Suspense fallback={<div className="mb-8 h-11 animate-pulse rounded-full bg-neutral-100" />}>
        <TanishqFilterBar
          brands={brands.map((item) => item.brand)}
          total={total}
        />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

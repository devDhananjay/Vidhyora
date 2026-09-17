import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import { COLLECTION_MAP } from "@/lib/catalog/collections";
import {
  buildProductWhere,
  getListingTitle,
  type ProductListParams,
} from "@/lib/products/product-query";
import { getProductFacets } from "@/lib/products/product-facets";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductListParams>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = COLLECTION_MAP[slug];
  if (!collection) {
    return { title: "Collection | VIDYORA" };
  }
  return {
    title: `${collection.title} | VIDYORA`,
    description: collection.description,
    alternates: {
      canonical: `/collections/${slug}`,
    },
    openGraph: {
      title: collection.title,
      description: collection.description,
      url: `/collections/${slug}`,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(COLLECTION_MAP).map((slug) => ({ slug }));
}

export default async function CollectionLandingPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const collection = COLLECTION_MAP[slug];
  if (!collection) notFound();

  const queryParams = await searchParams;
  const merged: ProductListParams = {
    ...collection.filters,
    ...queryParams,
    type: queryParams.type ?? collection.filters.type,
    occasion: queryParams.occasion ?? collection.filters.occasion,
    maxPrice: queryParams.maxPrice ?? collection.filters.maxPrice,
    collection: collection.filters.collection,
  };

  const [total, facets] = await Promise.all([
    prisma.product.count({ where: buildProductWhere(merged) }),
    getProductFacets(),
  ]);

  const title = getListingTitle(merged) || collection.title;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/" className="hover:text-[#8b2e2e]">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-800">{title}</span>
      </nav>

      <h1 className="mb-2 font-serif text-3xl text-neutral-900 sm:text-4xl">
        {title}{" "}
        <span className="text-base font-sans text-neutral-400 sm:text-lg">
          ({total.toLocaleString("en-IN")} results)
        </span>
      </h1>
      <p className="mb-6 text-sm text-neutral-500">{collection.description}</p>

      <Suspense
        fallback={
          <div className="mb-8 h-11 animate-pulse rounded-full bg-neutral-100" />
        }
      >
        <TanishqFilterBar facets={facets} total={total} />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <ProductGrid
          searchParams={Promise.resolve(merged)}
        />
      </Suspense>
    </div>
  );
}

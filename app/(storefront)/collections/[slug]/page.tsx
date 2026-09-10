import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import {
  buildProductWhere,
  getListingTitle,
  type ProductListParams,
} from "@/lib/products/product-query";

const COLLECTION_MAP: Record<
  string,
  { title: string; description: string; filters: ProductListParams }
> = {
  "under-50k": {
    title: "Under 50K",
    description: "Fine jewellery under ₹50,000",
    filters: { maxPrice: "50000", collection: "Under 50K" },
  },
  wedding: {
    title: "Wedding Jewellery",
    description: "Bridal and wedding jewellery collections",
    filters: { occasion: "wedding", collection: "Wedding Jewellery" },
  },
  diamond: {
    title: "Diamond Jewellery",
    description: "Shop diamond jewellery on VIDYORA",
    filters: { type: "diamond", collection: "Diamond" },
  },
  gold: {
    title: "Gold Jewellery",
    description: "Shop gold jewellery on VIDYORA",
    filters: { type: "gold", collection: "Gold" },
  },
  daily: {
    title: "Daily Wear",
    description: "Everyday jewellery for daily wear",
    filters: { occasion: "daily", collection: "Daily Wear" },
  },
  gifting: {
    title: "Gifting",
    description: "Festive and gift-ready jewellery",
    filters: { occasion: "festive", collection: "Gifting" },
  },
};

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

  const [total, brands] = await Promise.all([
    prisma.product.count({ where: buildProductWhere(merged) }),
    prisma.product.findMany({
      where: { status: "ACTIVE", approvalStatus: "APPROVED" },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
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
        <TanishqFilterBar
          brands={brands.map((item) => item.brand)}
          total={total}
        />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <ProductGrid
          searchParams={Promise.resolve(merged)}
        />
      </Suspense>
    </div>
  );
}

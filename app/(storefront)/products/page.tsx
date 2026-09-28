import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import { getProductFacets } from "@/lib/products/product-facets";
import {
  getListingTitle,
  type ProductListParams,
} from "@/lib/products/product-query";
import { fetchProductListPage } from "@/lib/products/list-products-page";
import {
  generateBreadcrumbStructuredData,
  generateItemListStructuredData,
} from "@/lib/structured-data";
import { BRAND_OG_IMAGE_SRC } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "All Jewellery",
  description:
    "Browse gold, diamond and fine jewellery online at VIDYORA — rings, earrings, necklaces and more with secure checkout.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "All Jewellery",
    description:
      "Browse gold, diamond and fine jewellery online at VIDYORA.",
    url: "/products",
    images: [{ url: BRAND_OG_IMAGE_SRC, width: 1200, height: 630, alt: "VIDYORA jewellery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Jewellery",
    description:
      "Browse gold, diamond and fine jewellery online at VIDYORA.",
    images: [BRAND_OG_IMAGE_SRC],
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductListParams>;
}) {
  const params = await searchParams;
  const listParams: ProductListParams = { ...params, page: undefined };
  const [facets, listPage] = await Promise.all([
    getProductFacets(),
    fetchProductListPage(listParams, 1, 12),
  ]);

  const title = getListingTitle(params);
  const siteUrl = getSiteUrl();
  const breadcrumbLd = generateBreadcrumbStructuredData([
    { name: "Home", url: siteUrl },
    { name: title, url: `${siteUrl}/products` },
  ]);
  const itemListLd = generateItemListStructuredData({
    name: title,
    description: "Gold, diamond and fine jewellery on VIDYORA",
    url: "/products",
    items: listPage.items.map((item) => ({
      name: item.name,
      url: `/products/${item.slug}`,
      image: item.thumbnail || item.images[0] || null,
    })),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <nav className="mb-4 text-sm text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#8b2e2e]">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-800">{title}</span>
      </nav>

      <h1 className="mb-6 font-serif text-3xl text-brand sm:text-4xl">
        {title}{" "}
        <span className="text-base font-sans text-neutral-400 sm:text-lg">
          ({listPage.total.toLocaleString("en-IN")} results)
        </span>
      </h1>

      <Suspense fallback={<div className="mb-8 h-11 animate-pulse rounded-full bg-neutral-100" />}>
        <TanishqFilterBar facets={facets} total={listPage.total} />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

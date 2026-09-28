import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import { COLLECTION_MAP } from "@/lib/catalog/collections";
import {
  getListingTitle,
  type ProductListParams,
} from "@/lib/products/product-query";
import { getProductFacets } from "@/lib/products/product-facets";
import { fetchProductListPage } from "@/lib/products/list-products-page";
import {
  generateBreadcrumbStructuredData,
  generateCollectionPageStructuredData,
  generateItemListStructuredData,
} from "@/lib/structured-data";
import { BRAND_OG_IMAGE_SRC } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

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
  if (!collection) notFound();

  return {
    title: collection.metaTitle,
    description: collection.description,
    keywords: collection.keywords,
    alternates: {
      canonical: `/collections/${slug}`,
    },
    openGraph: {
      title: collection.metaTitle,
      description: collection.description,
      url: `/collections/${slug}`,
      images: [
        {
          url: BRAND_OG_IMAGE_SRC,
          width: 1200,
          height: 630,
          alt: collection.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: collection.metaTitle,
      description: collection.description,
      images: [BRAND_OG_IMAGE_SRC],
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
    page: undefined,
  };

  const [facets, listPage] = await Promise.all([
    getProductFacets(),
    fetchProductListPage(merged, 1, 12),
  ]);

  const title = getListingTitle(merged) || collection.title;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/collections/${slug}`;

  const breadcrumbLd = generateBreadcrumbStructuredData([
    { name: "Home", url: siteUrl },
    { name: "Jewellery", url: `${siteUrl}/products` },
    { name: collection.title, url: pageUrl },
  ]);
  const collectionLd = generateCollectionPageStructuredData({
    name: collection.title,
    description: collection.description,
    url: `/collections/${slug}`,
    image: BRAND_OG_IMAGE_SRC,
  });
  const itemListLd = generateItemListStructuredData({
    name: collection.title,
    description: collection.description,
    url: `/collections/${slug}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
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
        <Link href="/products" className="hover:text-[#8b2e2e]">
          Jewellery
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-800">{title}</span>
      </nav>

      <h1 className="mb-2 font-serif text-3xl text-brand sm:text-4xl">
        {collection.title}{" "}
        <span className="text-base font-sans text-neutral-400 sm:text-lg">
          ({listPage.total.toLocaleString("en-IN")} results)
        </span>
      </h1>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-neutral-600">
        {collection.intro}
      </p>

      <Suspense
        fallback={
          <div className="mb-8 h-11 animate-pulse rounded-full bg-neutral-100" />
        }
      >
        <TanishqFilterBar facets={facets} total={listPage.total} />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <ProductGrid searchParams={Promise.resolve(merged)} />
      </Suspense>
    </div>
  );
}

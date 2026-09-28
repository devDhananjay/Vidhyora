import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import { type ProductListParams } from "@/lib/products/product-query";
import { getProductFacets } from "@/lib/products/product-facets";
import { fetchProductListPage } from "@/lib/products/list-products-page";
import {
  generateBreadcrumbStructuredData,
  generateItemListStructuredData,
  seoPageTitle,
} from "@/lib/structured-data";
import { BRAND_OG_IMAGE_SRC } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!category || !category.isActive) return null;
  return category;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) return { title: "Category Not Found" };

  const title = seoPageTitle(category.metaTitle?.trim() || category.name);
  const description =
    category.metaDescription?.trim() ||
    category.description ||
    `Shop ${category.name.toLowerCase()} jewellery online at VIDYORA — certified gold and diamond pieces with pan-India delivery.`;

  return {
    title,
    description,
    keywords: category.metaKeywords?.trim() || undefined,
    alternates: {
      canonical: `/categories/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/categories/${slug}`,
      images: [
        {
          url: category.image || BRAND_OG_IMAGE_SRC,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [category.image || BRAND_OG_IMAGE_SRC],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductListParams>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const resolved = await searchParams;
  const listParams = { ...resolved, category: slug, page: undefined };
  const [facets, listPage] = await Promise.all([
    getProductFacets(),
    fetchProductListPage(listParams, 1, 12),
  ]);

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/categories/${slug}`;
  const breadcrumbLd = generateBreadcrumbStructuredData([
    { name: "Home", url: siteUrl },
    { name: "Jewellery", url: `${siteUrl}/products` },
    { name: category.name, url: pageUrl },
  ]);
  const itemListLd = generateItemListStructuredData({
    name: category.name,
    description:
      category.description ||
      `Shop ${category.name} jewellery on VIDYORA`,
    url: `/categories/${slug}`,
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
        <Link href="/products" className="hover:text-[#8b2e2e]">
          Jewellery
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-800">{category.name}</span>
      </nav>

      <h1 className="mb-2 font-serif text-3xl text-brand sm:text-4xl">
        {category.name}{" "}
        <span className="text-base font-sans text-neutral-400 sm:text-lg">
          ({listPage.total.toLocaleString("en-IN")} results)
        </span>
      </h1>
      {category.description ? (
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-neutral-600">
          {category.description}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      <Suspense fallback={<div className="mb-8 h-11 animate-pulse rounded-full bg-neutral-100" />}>
        <TanishqFilterBar facets={facets} total={listPage.total} />
      </Suspense>

      <Suspense fallback={<ProductListingSkeleton />}>
        <ProductGrid searchParams={Promise.resolve(listParams)} />
      </Suspense>
    </div>
  );
}

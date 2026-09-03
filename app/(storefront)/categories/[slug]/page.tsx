import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TanishqFilterBar } from "@/components/products/tanishq-filter-bar";
import { ProductListingSkeleton } from "@/components/products/product-listing-skeleton";
import {
  buildProductWhere,
  type ProductListParams,
} from "@/lib/products/product-query";

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

  return {
    title: `${category.name} | VIDYORA`,
    description:
      category.description ||
      `Shop the best ${category.name.toLowerCase()} jewellery on VIDYORA`,
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
  const listParams = { ...resolved, category: slug };
  const [total, brands] = await Promise.all([
    prisma.product.count({ where: buildProductWhere(listParams) }),
    prisma.product.findMany({
      where: { status: "ACTIVE", approvalStatus: "APPROVED" },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/" className="hover:text-[#8b2e2e]">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-800">{category.name}</span>
      </nav>

      <h1 className="mb-6 font-serif text-4xl text-neutral-900">
        {category.name}{" "}
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
        <ProductGrid searchParams={Promise.resolve(listParams)} />
      </Suspense>
    </div>
  );
}

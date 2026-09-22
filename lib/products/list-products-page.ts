import prisma from "@/lib/prisma";
import { PAGINATION } from "@/lib/constants";
import {
  buildProductWhere,
  getProductOrderBy,
  isRelevanceSort,
  rankBySearchRelevance,
  type ProductListParams,
} from "@/lib/products/product-query";
import {
  imageUrlsForProduct,
  jewelleryCardMeta,
  mapCardVariants,
  getProductBadgeSets,
  resolveProductBadge,
} from "@/lib/products/product-card-data";
import type { ProductCardBadge } from "@/lib/products/product-badges";

export type PlpCardProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  basePrice: number;
  compareAtPrice: number | null;
  thumbnail: string | null;
  images: string[];
  badge: ProductCardBadge | null;
  metalLabel: string | null;
  variants: Array<{ id: string; stock: number; label: string }>;
};

export type ProductListPageResult = {
  items: PlpCardProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const productListSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  basePrice: true,
  compareAtPrice: true,
  thumbnail: true,
  attributes: true,
  images: {
    select: { url: true },
    orderBy: { sortOrder: "asc" as const },
  },
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      stock: true,
      reservedStock: true,
      attributes: true,
    },
    orderBy: { price: "asc" as const },
  },
} as const;

export async function fetchProductListPage(
  params: ProductListParams,
  page = 1,
  pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
): Promise<ProductListPageResult> {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(
    Math.max(1, pageSize),
    PAGINATION.MAX_PAGE_SIZE,
  );
  const skip = (safePage - 1) * safeSize;
  const where = buildProductWhere(params);
  const useRelevance = isRelevanceSort(params.sort, params.q);
  const orderBy = getProductOrderBy(useRelevance ? "relevance" : params.sort);

  const [rawProducts, total, badgeSets] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productListSelect,
      orderBy,
      skip: useRelevance ? 0 : skip,
      take: useRelevance
        ? Math.min(safeSize * 3, PAGINATION.MAX_PAGE_SIZE)
        : safeSize,
    }),
    prisma.product.count({ where }),
    getProductBadgeSets(),
  ]);

  const pageRows = useRelevance
    ? rankBySearchRelevance(rawProducts, params.q).slice(skip, skip + safeSize)
    : rawProducts;

  const items: PlpCardProduct[] = pageRows.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    thumbnail: product.thumbnail,
    images: imageUrlsForProduct(product),
    badge: resolveProductBadge(product, badgeSets),
    metalLabel: jewelleryCardMeta(product.attributes).label ?? null,
    variants: mapCardVariants(product.variants),
  }));

  return {
    items,
    total,
    page: safePage,
    pageSize: safeSize,
    hasMore: skip + items.length < total,
  };
}

/** Stable key so the infinite grid remounts when filters change (not when page does). */
export function productListFilterKey(params: ProductListParams): string {
  const { page: _page, ...rest } = params;
  return JSON.stringify(rest);
}

import prisma from "@/lib/prisma";
import type { ProductFilters } from "@/types/product";
import { PAGINATION } from "@/lib/constants";
import {
  buildProductWhere,
  getProductOrderBy,
  isRelevanceSort,
  rankBySearchRelevance,
  splitCsv,
  type ProductListParams,
} from "@/lib/products/product-query";

export type SearchResult = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  thumbnail: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  attributes: unknown;
  images: { url: string }[];
};

/**
 * Product search service (token match + relevance ranking).
 * Designed to be swappable with Elasticsearch/OpenSearch/Algolia later.
 */
export class ProductSearchService {
  async search(
    query: string,
    filters: ProductFilters = {},
    page = 1,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  ) {
    const skip = (page - 1) * pageSize;
    const q = query.trim();
    const asCsv = (value?: string | string[]) =>
      Array.isArray(value) ? value.join(",") : value;

    const listParams: ProductListParams = {
      q: q || undefined,
      category: filters.category,
      brand: filters.brand?.join(","),
      minPrice:
        filters.minPrice !== undefined ? String(filters.minPrice) : undefined,
      maxPrice:
        filters.maxPrice !== undefined ? String(filters.maxPrice) : undefined,
      sort: filters.sort,
      metal: asCsv(filters.metal),
      karat: asCsv(filters.karat),
      gender: asCsv(filters.gender),
      type: asCsv(filters.type),
      occasion: asCsv(filters.occasion),
      item: asCsv(filters.item),
      stone: asCsv(filters.stone),
      collection: asCsv(filters.collection),
      size: asCsv(filters.size),
    };
    const where = buildProductWhere(listParams);
    const useRelevance = isRelevanceSort(filters.sort, q);
    const orderBy = getProductOrderBy(
      useRelevance ? "relevance" : filters.sort,
    );

    // Over-fetch a page window so we can re-rank by name prefix relevance.
    const fetchTake = useRelevance
      ? Math.min(pageSize * 3, PAGINATION.MAX_PAGE_SIZE)
      : pageSize;
    const fetchSkip = useRelevance ? 0 : skip;

    const [rawItems, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          thumbnail: true,
          basePrice: true,
          compareAtPrice: true,
          attributes: true,
          images: {
            select: { url: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        skip: fetchSkip,
        take: fetchTake,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    const ranked = useRelevance
      ? rankBySearchRelevance(rawItems, q).slice(skip, skip + pageSize)
      : rawItems;

    return {
      items: ranked.map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      })) as SearchResult[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async suggest(query: string, limit = 8): Promise<SearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const where = buildProductWhere({ q });
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        thumbnail: true,
        basePrice: true,
        compareAtPrice: true,
        attributes: true,
        images: {
          select: { url: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      take: Math.max(limit * 2, 16),
      orderBy: { name: "asc" },
    });

    return rankBySearchRelevance(products, q)
      .slice(0, limit)
      .map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      }));
  }

  /** Map storefront listing URL params into ProductFilters. */
  filtersFromParams(params: ProductListParams): ProductFilters {
    const brands = splitCsv(params.brand);
    const optionalCsv = (value?: string) => {
      const items = splitCsv(value);
      return items.length ? items : undefined;
    };
    return {
      category: params.category,
      brand: brands.length ? brands : undefined,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      sort: (params.sort as ProductFilters["sort"]) || undefined,
      q: params.q,
      metal: optionalCsv(params.metal),
      karat: optionalCsv(params.karat),
      gender: optionalCsv(params.gender),
      type: optionalCsv(params.type),
      occasion: optionalCsv(params.occasion),
      item: optionalCsv(params.item),
      stone: optionalCsv(params.stone),
      collection: optionalCsv(params.collection),
      size: optionalCsv(params.size),
    };
  }
}

export const productSearch = new ProductSearchService();

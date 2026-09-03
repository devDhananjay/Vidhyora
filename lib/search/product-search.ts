import prisma from "@/lib/prisma";
import type { ProductFilters } from "@/types/product";
import { PAGINATION } from "@/lib/constants";

export type SearchResult = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  thumbnail: string | null;
  basePrice: number;
};

/**
 * PostgreSQL full-text search service.
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

    const where = {
      approvalStatus: "APPROVED" as const,
      status: "ACTIVE" as const,
      ...(filters.category && {
        category: { slug: filters.category },
      }),
      ...(filters.brand?.length && {
        brand: { in: filters.brand },
      }),
      ...(filters.minPrice !== undefined && {
        basePrice: { gte: filters.minPrice },
      }),
      ...(filters.maxPrice !== undefined && {
        basePrice: { lte: filters.maxPrice },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { brand: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          {
            variants: {
              some: { sku: { contains: q, mode: "insensitive" as const } },
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          thumbnail: true,
          basePrice: true,
        },
        skip,
        take: pageSize,
        orderBy: this.getOrderBy(filters.sort),
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async suggest(query: string, limit = 8): Promise<string[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const products = await prisma.product.findMany({
      where: {
        approvalStatus: "APPROVED",
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { name: true },
      take: limit,
      distinct: ["name"],
    });

    return products.map((p) => p.name);
  }

  private getOrderBy(sort?: ProductFilters["sort"]) {
    switch (sort) {
      case "price-low":
        return { basePrice: "asc" as const };
      case "price-high":
        return { basePrice: "desc" as const };
      case "newest":
        return { createdAt: "desc" as const };
      default:
        return { createdAt: "desc" as const };
    }
  }
}

export const productSearch = new ProductSearchService();

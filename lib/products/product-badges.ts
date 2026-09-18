import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export type ProductCardBadge = "BESTSELLERS" | "EXPERTS_CHOICE";

/** Min paid units sold to auto-earn Bestsellers */
export const BESTSELLER_MIN_UNITS = 2;

/** Min approved reviews + rating for Expert's Choice */
export const EXPERT_MIN_REVIEWS = 1;
export const EXPERT_MIN_RATING = 4;
/** Strong instant-save deals auto-qualify as Expert's Choice */
export const EXPERT_MIN_DISCOUNT_PCT = 20;

function attrFlag(attributes: unknown, key: string) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return false;
  }
  const value = (attributes as Record<string, unknown>)[key];
  return value === true || value === "true" || value === 1 || value === "1";
}

export function isBestSellerFlag(attributes: unknown) {
  return attrFlag(attributes, "bestSeller");
}

export function isExpertChoiceFlag(attributes: unknown) {
  return attrFlag(attributes, "expertChoice");
}

/**
 * Auto Bestsellers: products with enough paid/confirmed order volume.
 * Cached 5 minutes — cheap for PLP / homepage.
 */
export const getAutoBestsellerIds = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
          orderStatus: {
            notIn: ["CANCELLED", "REFUNDED"],
          },
        },
      },
      _sum: { quantity: true },
    });

    return rows
      .filter((row) => (row._sum.quantity ?? 0) >= BESTSELLER_MIN_UNITS)
      .map((row) => row.productId);
  },
  ["product-auto-bestsellers-v1"],
  { revalidate: 300 },
);

/**
 * Auto Expert's Choice: quality-checked, certified, highly rated, or strong deals.
 */
export const getAutoExpertChoiceIds = unstable_cache(
  async (): Promise<string[]> => {
    const [qualityOrCert, rated, deals] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          OR: [
            { qualityCheckedAt: { not: null } },
            { certificateNumber: { not: null } },
          ],
        },
        select: { id: true },
      }),
      prisma.review.groupBy({
        by: ["productId"],
        where: { status: "APPROVED" },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          compareAtPrice: { not: null },
        },
        select: {
          id: true,
          basePrice: true,
          compareAtPrice: true,
        },
      }),
    ]);

    const ids = new Set(qualityOrCert.map((p) => p.id));
    for (const row of rated) {
      if (
        row._count._all >= EXPERT_MIN_REVIEWS &&
        (row._avg.rating ?? 0) >= EXPERT_MIN_RATING
      ) {
        ids.add(row.productId);
      }
    }
    for (const product of deals) {
      const compare = Number(product.compareAtPrice);
      const base = Number(product.basePrice);
      if (!(compare > 0) || !(base > 0) || compare <= base) continue;
      const discount = ((compare - base) / compare) * 100;
      if (discount >= EXPERT_MIN_DISCOUNT_PCT) ids.add(product.id);
    }
    return [...ids];
  },
  ["product-auto-expert-choice-v2"],
  { revalidate: 300 },
);

export async function getProductBadgeSets() {
  const [bestsellers, experts] = await Promise.all([
    getAutoBestsellerIds(),
    getAutoExpertChoiceIds(),
  ]);
  return {
    bestsellers: new Set(bestsellers),
    experts: new Set(experts),
  };
}

/**
 * One badge per card (Tanishq-style). Expert's Choice wins over Bestsellers.
 * Manual attribute flags always count; auto sets fill in the rest.
 */
export function resolveProductBadge(
  product: {
    id: string;
    attributes?: unknown;
  },
  sets?: {
    bestsellers: Set<string>;
    experts: Set<string>;
  },
): ProductCardBadge | null {
  const manualExpert = isExpertChoiceFlag(product.attributes);
  const manualBest = isBestSellerFlag(product.attributes);
  const autoExpert = sets?.experts.has(product.id) ?? false;
  const autoBest = sets?.bestsellers.has(product.id) ?? false;

  if (manualExpert || autoExpert) return "EXPERTS_CHOICE";
  if (manualBest || autoBest) return "BESTSELLERS";
  return null;
}

export function productBadgeLabel(badge: ProductCardBadge) {
  return badge === "EXPERTS_CHOICE" ? "EXPERT'S CHOICE" : "BESTSELLERS";
}

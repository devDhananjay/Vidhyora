import prisma from "@/lib/prisma";
import { jewelleryCardMeta } from "@/lib/products/product-card-data";

export type FacetOption = {
  value: string;
  label: string;
  count: number;
};

export type PriceFacetOption = FacetOption & {
  min: string;
  max: string;
};

export type ProductFacets = {
  prices: PriceFacetOption[];
  types: FacetOption[];
  brands: FacetOption[];
  genders: FacetOption[];
  karats: FacetOption[];
  sizes: FacetOption[];
  occasions: FacetOption[];
  metals: FacetOption[];
};

const PRICE_BUCKETS = [
  { min: 0, max: 10000, label: "Under ₹10,000" },
  { min: 10000, max: 25000, label: "₹10,000 - ₹25,000" },
  { min: 25000, max: 50000, label: "₹25,000 - ₹50,000" },
  { min: 50000, max: 100000, label: "₹50,000 - ₹1,00,000" },
  { min: 100000, max: 10_000_000, label: "Above ₹1,00,000" },
] as const;

const TYPE_DEFS = [
  { value: "gold", label: "Gold Jewellery", terms: ["gold"] },
  { value: "diamond", label: "Diamond Jewellery", terms: ["diamond"] },
] as const;

const GENDER_DEFS = [
  {
    value: "women",
    label: "Women",
    terms: ["women", "woman", "ladies", "lady", "female", "bridal", "her"],
  },
  {
    value: "men",
    label: "Men",
    terms: ["gents", "for men", "men's", " mens", "him"],
  },
] as const;

const SIZE_DEFS = [
  { value: "16", label: "16", terms: ["16", "16 inch", '16"', "16in"] },
  { value: "18", label: "18", terms: ["18", "18 inch", '18"', "18in"] },
  { value: "20", label: "20", terms: ["20", "20 inch", '20"', "20in"] },
  {
    value: "Free Size",
    label: "Free Size",
    terms: ["free size", "freesize", "one size", "onesize", "adjustable"],
  },
] as const;

const OCCASION_DEFS = [
  {
    value: "daily",
    label: "Daily Wear",
    terms: ["daily", "everyday", "casual"],
  },
  {
    value: "wedding",
    label: "Wedding",
    terms: ["wedding", "bridal", "engagement"],
  },
  {
    value: "festive",
    label: "Festive",
    terms: ["festive", "festival", "celebration", "auspicious"],
  },
] as const;

const METAL_ORDER = ["Yellow Gold", "White Gold", "Rose Gold", "Gold"] as const;

function blobOf(product: {
  name: string;
  brand: string;
  description: string | null;
  shortDescription: string | null;
  categoryName?: string;
  attributes: unknown;
  variantLabels: string[];
}) {
  const meta = jewelleryCardMeta(product.attributes);
  return [
    product.name,
    product.brand,
    product.description ?? "",
    product.shortDescription ?? "",
    product.categoryName ?? "",
    meta.metal ?? "",
    meta.karat ?? "",
    ...product.variantLabels,
  ]
    .join(" ")
    .toLowerCase();
}

function matchesAny(blob: string, terms: readonly string[]) {
  return terms.some((term) => blob.includes(term.toLowerCase()));
}

function bump(map: Map<string, FacetOption>, value: string, label: string) {
  const existing = map.get(value);
  if (existing) {
    existing.count += 1;
    return;
  }
  map.set(value, { value, label, count: 1 });
}

function karatValue(raw: string) {
  const match = raw.match(/(\d{1,2})\s*K/i);
  if (match) return match[1];
  if (/^\d{1,2}$/.test(raw)) return raw;
  return "";
}

function normalizeMetalLabel(raw: string) {
  if (/yellow\s*gold/i.test(raw)) return "Yellow Gold";
  if (/white\s*gold/i.test(raw)) return "White Gold";
  if (/rose\s*gold/i.test(raw)) return "Rose Gold";
  if (/^gold$/i.test(raw) || /gold\s*finish/i.test(raw)) return "Gold";
  return "";
}

/** Filter value used in URL for metal (matches product-query METAL_TERMS). */
function metalFilterValue(label: string) {
  if (label === "Yellow Gold" || label === "Gold") return "Gold";
  return label;
}

export function priceFacetKey(min: string, max: string) {
  return `${min}-${max}`;
}

export function labelForPriceValue(value: string) {
  const match = PRICE_BUCKETS.find(
    (bucket) => priceFacetKey(String(bucket.min), String(bucket.max)) === value,
  );
  if (match) return match.label;
  const [min, max] = value.split("-");
  if (min && max) return `₹${Number(min).toLocaleString("en-IN")} - ₹${Number(max).toLocaleString("en-IN")}`;
  return value;
}

export async function getProductFacets(): Promise<ProductFacets> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", approvalStatus: "APPROVED" },
    select: {
      name: true,
      brand: true,
      description: true,
      shortDescription: true,
      basePrice: true,
      attributes: true,
      category: { select: { name: true, slug: true } },
      variants: { select: { attributes: true }, take: 8 },
    },
  });

  const priceCounts = new Map<string, number>();
  const brands = new Map<string, FacetOption>();
  const types = new Map<string, FacetOption>();
  const genders = new Map<string, FacetOption>();
  const karats = new Map<string, FacetOption>();
  const sizes = new Map<string, FacetOption>();
  const occasions = new Map<string, FacetOption>();
  const metals = new Map<string, FacetOption>();

  for (const product of products) {
    const price = Number(product.basePrice);
    for (const bucket of PRICE_BUCKETS) {
      if (price >= bucket.min && price < bucket.max) {
        const key = priceFacetKey(String(bucket.min), String(bucket.max));
        priceCounts.set(key, (priceCounts.get(key) ?? 0) + 1);
        break;
      }
    }

    if (product.brand.trim()) {
      bump(brands, product.brand, product.brand);
    }

    const variantLabels = product.variants.map((variant) => {
      const attrs = variant.attributes;
      if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return "";
      const name = (attrs as Record<string, unknown>).name;
      return typeof name === "string" ? name : "";
    });

    const blob = blobOf({
      name: product.name,
      brand: product.brand,
      description: product.description,
      shortDescription: product.shortDescription,
      categoryName: product.category?.name,
      attributes: product.attributes,
      variantLabels,
    });

    for (const type of TYPE_DEFS) {
      if (
        matchesAny(blob, type.terms) ||
        product.category?.slug === type.value
      ) {
        bump(types, type.value, type.label);
      }
    }

    for (const gender of GENDER_DEFS) {
      if (matchesAny(blob, gender.terms)) {
        bump(genders, gender.value, gender.label);
      }
    }

    const meta = jewelleryCardMeta(product.attributes);
    if (meta.karat) {
      const value = karatValue(meta.karat);
      if (value) bump(karats, value, `${value}KT`);
    } else {
      for (const value of ["18", "22", "14", "9"] as const) {
        if (matchesAny(blob, [`${value}k`, `${value}kt`, `${value} kt`])) {
          bump(karats, value, `${value}KT`);
        }
      }
    }

    for (const size of SIZE_DEFS) {
      if (matchesAny(blob, size.terms)) {
        bump(sizes, size.value, size.label);
      }
    }

    for (const occasion of OCCASION_DEFS) {
      if (matchesAny(blob, occasion.terms)) {
        bump(occasions, occasion.value, occasion.label);
      }
    }

    const metalLabel =
      (meta.metal && normalizeMetalLabel(meta.metal)) ||
      (matchesAny(blob, ["yellow gold"])
        ? "Yellow Gold"
        : matchesAny(blob, ["white gold"])
          ? "White Gold"
          : matchesAny(blob, ["rose gold"])
            ? "Rose Gold"
            : matchesAny(blob, ["gold"])
              ? "Gold"
              : "");
    if (metalLabel) {
      const value = metalFilterValue(metalLabel);
      bump(metals, value, metalLabel === "Gold" ? "Yellow Gold" : metalLabel);
    }
  }

  const prices: PriceFacetOption[] = PRICE_BUCKETS.filter((bucket) => {
    const key = priceFacetKey(String(bucket.min), String(bucket.max));
    return (priceCounts.get(key) ?? 0) > 0;
  }).map((bucket) => {
    const key = priceFacetKey(String(bucket.min), String(bucket.max));
    return {
      value: key,
      label: bucket.label,
      min: String(bucket.min),
      max: String(bucket.max),
      count: priceCounts.get(key) ?? 0,
    };
  });

  const sortByCountThenLabel = (a: FacetOption, b: FacetOption) =>
    b.count - a.count || a.label.localeCompare(b.label);

  const karatsList = [...karats.values()].sort(
    (a, b) => Number(b.value) - Number(a.value),
  );

  const metalsList = [...metals.values()].sort((a, b) => {
    const ai = METAL_ORDER.indexOf(a.label as (typeof METAL_ORDER)[number]);
    const bi = METAL_ORDER.indexOf(b.label as (typeof METAL_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return {
    prices,
    types: [...types.values()].sort(sortByCountThenLabel),
    brands: [...brands.values()].sort((a, b) => a.label.localeCompare(b.label)),
    genders: [...genders.values()].sort(sortByCountThenLabel),
    karats: karatsList,
    sizes: SIZE_DEFS.map((size) => sizes.get(size.value)).filter(
      (item): item is FacetOption => Boolean(item),
    ),
    occasions: OCCASION_DEFS.map((item) => occasions.get(item.value)).filter(
      (item): item is FacetOption => Boolean(item),
    ),
    metals: metalsList,
  };
}

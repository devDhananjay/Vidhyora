import type { Prisma } from "@prisma/client";

export type ProductListParams = {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  price?: string;
  sort?: string;
  page?: string;
  metal?: string;
  karat?: string;
  gender?: string;
  type?: string;
  occasion?: string;
  item?: string;
  stone?: string;
  collection?: string;
  size?: string;
};

export function splitCsv(value?: string | null): string[] {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function toggleCsv(current: string, value: string): string {
  const items = splitCsv(current);
  return items.includes(value)
    ? items.filter((item) => item !== value).join(",")
    : [...items, value].join(",");
}

const TYPE_TERMS: Record<string, string[]> = {
  gold: ["gold"],
  diamond: ["diamond"],
};

const GENDER_TERMS: Record<string, string[]> = {
  women: ["women", "woman", "ladies", "lady", "female", "bridal"],
  men: ["gents", "for men", "men's", " mens"],
};

const KARAT_TERMS: Record<string, string[]> = {
  "18": ["18K", "18KT", "18 KT"],
  "22": ["22K", "22KT", "22 KT"],
};

const SIZE_TERMS: Record<string, string[]> = {
  "16": ["16", "16 inch", '16"', "16in"],
  "18": ["18", "18 inch", '18"', "18in"],
  "20": ["20", "20 inch", '20"', "20in"],
  "Free Size": ["free size", "freesize", "one size", "onesize", "adjustable"],
};

const METAL_TERMS: Record<string, string[]> = {
  Gold: ["yellow gold"],
  "White Gold": ["white gold"],
  "Rose Gold": ["rose gold"],
};

const OCCASION_TERMS: Record<string, string[]> = {
  daily: ["daily", "everyday", "casual"],
  wedding: ["wedding", "bridal", "engagement"],
  festive: ["festive", "festival", "celebration", "auspicious"],
  office: ["office", "work", "formal"],
  modern: ["modern", "contemporary"],
  casual: ["casual", "everyday", "daily"],
  traditional: ["traditional", "bridal", "ethnic", "kundan", "antique"],
};

const ITEM_FILTERS: Record<string, { terms: string[]; exclude?: string[] }> = {
  earrings: { terms: ["earring", "jhumka"] },
  drops: { terms: ["drop", "dangler"] },
  hoops: { terms: ["hoop", "huggie"] },
  jhumkas: { terms: ["jhumka"] },
  studs: { terms: ["stud"] },
  rings: { terms: ["ring"], exclude: ["earring"] },
  pendants: { terms: ["pendant"] },
  necklaces: { terms: ["necklace", "choker"] },
  chains: { terms: ["chain"] },
  bangles: { terms: ["bangle"] },
  bracelets: { terms: ["bracelet"] },
  mangalsutra: { terms: ["mangalsutra", "mangal"] },
  nosepin: { terms: ["nose pin", "nosepin"] },
  kadas: { terms: ["kada"] },
  sets: { terms: ["set"] },
  choker: { terms: ["choker"] },
  anklets: { terms: ["anklet"] },
  tikka: { terms: ["tikka"] },
  coins: { terms: ["coin"] },
  gemstone: {
    terms: [
      "emerald",
      "ruby",
      "sapphire",
      "amethyst",
      "pearl",
      "coral",
      "turquoise",
      "gemstone",
    ],
  },
  emerald: { terms: ["emerald"] },
  ruby: { terms: ["ruby"] },
};

const ITEM_LABELS: Record<string, string> = {
  earrings: "Earrings",
  drops: "Drop Earrings",
  hoops: "Hoop Earrings",
  jhumkas: "Jhumkas",
  studs: "Stud Earrings",
  rings: "Finger Rings",
  pendants: "Pendants",
  necklaces: "Necklaces",
  chains: "Chains",
  bangles: "Bangles",
  bracelets: "Bracelets",
  mangalsutra: "Mangalsutra",
  nosepin: "Nose Pins",
  kadas: "Kadas",
  sets: "Jewellery Sets",
  choker: "Chokers",
  anklets: "Anklets",
  tikka: "Accessories",
  coins: "Gold Coins",
  gemstone: "Gemstone",
  emerald: "Emerald",
  ruby: "Ruby",
};

function nameMatch(terms: string[]): Prisma.ProductWhereInput {
  return {
    OR: terms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { slug: { contains: term, mode: "insensitive" as const } },
      { shortDescription: { contains: term, mode: "insensitive" as const } },
    ]),
  };
}

function itemClause(key: string): Prisma.ProductWhereInput {
  const config = ITEM_FILTERS[key];
  if (!config) return nameMatch([key]);
  const matched = nameMatch(config.terms);
  if (!config.exclude?.length) return matched;
  return {
    AND: [matched, { NOT: nameMatch(config.exclude) }],
  };
}

function textMatch(terms: string[]): Prisma.ProductWhereInput {
  return {
    OR: terms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { brand: { contains: term, mode: "insensitive" as const } },
      { description: { contains: term, mode: "insensitive" as const } },
      { shortDescription: { contains: term, mode: "insensitive" as const } },
    ]),
  };
}

function anyGroup(values: string[], dictionary: Record<string, string[]>) {
  const groups = values
    .map((value) => dictionary[value] ?? [value])
    .filter((terms) => terms.length > 0);
  if (groups.length === 0) return null;
  return { OR: groups.map((terms) => textMatch(terms)) };
}

function parsePriceRanges(params: ProductListParams) {
  const fromCsv = splitCsv(params.price)
    .map((token) => {
      const [min, max] = token.split("-");
      const gte = Number(min);
      const lte = Number(max);
      if (Number.isNaN(gte) || Number.isNaN(lte)) return null;
      return { gte, lte };
    })
    .filter((range): range is { gte: number; lte: number } => range !== null);

  if (fromCsv.length > 0) return fromCsv;

  if (params.minPrice || params.maxPrice) {
    return [
      {
        ...(params.minPrice && { gte: parseFloat(params.minPrice) }),
        ...(params.maxPrice && { lte: parseFloat(params.maxPrice) }),
      },
    ];
  }

  return [];
}

/** Split a free-text query into searchable tokens (2+ chars). */
export function searchTokens(q?: string | null): string[] {
  if (!q?.trim()) return [];
  return q
    .trim()
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function tokenMatchClause(token: string): Prisma.ProductWhereInput {
  const mode = "insensitive" as const;
  return {
    OR: [
      { name: { contains: token, mode } },
      { brand: { contains: token, mode } },
      { slug: { contains: token, mode } },
      { shortDescription: { contains: token, mode } },
      { description: { contains: token, mode } },
      {
        variants: {
          some: { sku: { contains: token, mode } },
        },
      },
    ],
  };
}

function querySearchClause(q?: string | null): Prisma.ProductWhereInput | null {
  const tokens = searchTokens(q);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return tokenMatchClause(tokens[0]);
  return { AND: tokens.map((token) => tokenMatchClause(token)) };
}

/**
 * Prefer name prefix matches, then name contains, then brand, then others.
 * Safe to call after DB fetch when sort is default/relevance and `q` is set.
 */
export function rankBySearchRelevance<T extends { name: string; brand?: string | null }>(
  items: T[],
  q?: string | null,
): T[] {
  const tokens = searchTokens(q);
  if (tokens.length === 0) return items;
  const primary = tokens[0].toLowerCase();

  const score = (item: T) => {
    const name = item.name.toLowerCase();
    const brand = (item.brand ?? "").toLowerCase();
    if (name.startsWith(primary)) return 0;
    if (name.includes(primary)) return 1;
    if (brand.startsWith(primary)) return 2;
    if (brand.includes(primary)) return 3;
    return 4;
  };

  return [...items].sort((a, b) => {
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

export function buildProductWhere(
  params: ProductListParams,
): Prisma.ProductWhereInput {
  const brands = splitCsv(params.brand);
  const extra: Prisma.ProductWhereInput[] = [];

  const typeFilter = anyGroup(splitCsv(params.type), TYPE_TERMS);
  if (typeFilter) extra.push(typeFilter);

  const genderFilter = anyGroup(splitCsv(params.gender), GENDER_TERMS);
  if (genderFilter) extra.push(genderFilter);

  const karatFilter = anyGroup(splitCsv(params.karat), KARAT_TERMS);
  if (karatFilter) extra.push(karatFilter);

  const sizeFilter = anyGroup(splitCsv(params.size), SIZE_TERMS);
  if (sizeFilter) extra.push(sizeFilter);

  const metalFilter = anyGroup(splitCsv(params.metal), METAL_TERMS);
  if (metalFilter) extra.push(metalFilter);

  const occasionFilter = anyGroup(splitCsv(params.occasion), OCCASION_TERMS);
  if (occasionFilter) extra.push(occasionFilter);

  const itemFilters = splitCsv(params.item).map((key) => itemClause(key));
  if (itemFilters.length === 1) extra.push(itemFilters[0]);
  else if (itemFilters.length > 1) extra.push({ OR: itemFilters });

  if (params.stone) extra.push(itemClause(params.stone));

  const priceRanges = parsePriceRanges(params);
  if (priceRanges.length === 1) {
    extra.push({ basePrice: priceRanges[0] });
  } else if (priceRanges.length > 1) {
    extra.push({
      OR: priceRanges.map((range) => ({ basePrice: range })),
    });
  }

  const qClause = querySearchClause(params.q);
  if (qClause) extra.push(qClause);

  return {
    status: "ACTIVE",
    approvalStatus: "APPROVED",
    ...(params.category && {
      category: { slug: params.category },
    }),
    ...(brands.length > 0 && {
      brand: { in: brands },
    }),
    ...(extra.length > 0 ? { AND: extra } : {}),
  };
}

export function getListingTitle(params: ProductListParams) {
  if (params.collection) return params.collection;
  if (params.q) return `Search results for “${params.q}”`;

  const types = splitCsv(params.type);
  const items = splitCsv(params.item).map((key) => ITEM_LABELS[key] ?? key);
  const occasions = splitCsv(params.occasion);
  const typeLabel = [
    types.includes("gold") ? "Gold" : null,
    types.includes("diamond") ? "Diamond" : null,
  ]
    .filter(Boolean)
    .join(" & ");

  if (params.maxPrice === "50000" && !params.minPrice && !params.price) {
    return items[0] ? `${items[0]} Under 50K` : "Under 50K";
  }
  if (occasions.includes("wedding") && items.length === 0 && !typeLabel) {
    return "Wedding Jewellery";
  }
  if (occasions.includes("daily") && items.length === 0 && !typeLabel) {
    return "Daily Wear";
  }
  if (typeLabel && items.length > 0) return `${typeLabel} ${items.join(", ")}`;
  if (items.length > 0) return items.join(", ");
  if (typeLabel) return typeLabel;
  if (params.gender === "women") return "Jewellery for Her";
  if (params.gender === "men") return "Jewellery for Him";
  return "All Jewellery";
}

export function isRelevanceSort(sort?: string | null, q?: string | null) {
  if (!searchTokens(q).length) return false;
  return !sort || sort === "default" || sort === "relevance";
}

export function getProductOrderBy(sort?: string) {
  switch (sort) {
    case "price-low":
      return { basePrice: "asc" as const };
    case "price-high":
      return { basePrice: "desc" as const };
    case "newest":
      return { createdAt: "desc" as const };
    case "name":
    case "relevance":
      return { name: "asc" as const };
    default:
      return { createdAt: "desc" as const };
  }
}

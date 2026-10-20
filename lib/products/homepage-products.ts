import prisma from "@/lib/prisma";
import { sellableStock } from "@/lib/products/product-card-data";
import { productMatchesItemFilter } from "@/lib/products/product-query";
import type { HomepageConfigData } from "@/lib/validations/homepage";

const ROTATION_MS = 15 * 60 * 1000; // refresh featured imagery every 15 min
const CATALOG_TAKE = 72;

const CATEGORY_NAME_TO_ITEM: Record<string, string> = {
  earrings: "earrings",
  "finger rings": "rings",
  rings: "rings",
  pendants: "pendants",
  necklaces: "necklaces",
  bracelets: "bracelets",
  bangles: "bangles",
  chains: "chains",
};

const WEDDING_BRAND_IMAGE = "/images/wedding-vidyora.jpg";

function resolveWeddingImage(current: string) {
  if (
    !current ||
    current.includes("bridal-rivaah") ||
    current.includes("unsplash.com") ||
    current.includes("tata")
  ) {
    return WEDDING_BRAND_IMAGE;
  }
  return current;
}

export type HomepageCatalogProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  basePrice: number;
  compareAtPrice: number | null;
  thumbnail: string | null;
  attributes: unknown;
  categorySlug: string | null;
  shortDescription: string | null;
  images: { url: string }[];
  variants: {
    id: string;
    stock: number;
    reservedStock: number;
    attributes: unknown;
  }[];
  haystack: string;
};

function rotationSeed(now = Date.now()) {
  return Math.floor(now / ROTATION_MS);
}

/** Deterministic shuffle so the same bucket yields the same order. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function productImage(product: HomepageCatalogProduct): string | null {
  if (product.thumbnail?.trim()) return product.thumbnail.trim();
  const first = product.images.find((img) => img.url?.trim());
  return first?.url?.trim() || null;
}

function isInStock(product: HomepageCatalogProduct) {
  return product.variants.some((v) => sellableStock(v) > 0);
}

function matchesItem(product: HomepageCatalogProduct, itemKey: string) {
  // Keep homepage tiles and /products?item=… filters on the exact same rules.
  return productMatchesItemFilter(
    {
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      categorySlug: product.categorySlug,
    },
    itemKey,
  );
}

function matchesType(product: HomepageCatalogProduct, type: "gold" | "diamond") {
  if (type === "diamond") {
    return /diamond|solitaire|lab.?grown/i.test(product.haystack);
  }
  return /gold|coin|22k|18k|14k|yellow gold|rose gold|white gold/i.test(
    product.haystack,
  );
}

function matchesOccasion(product: HomepageCatalogProduct, occasion: string) {
  const map: Record<string, RegExp> = {
    party: /party|evening|cocktail|statement/i,
    daily: /daily|everyday|casual|office|workwear/i,
    office: /office|work|daily|everyday|minimal/i,
    festive: /festive|auspicious|celebration|wedding|bridal|occasion/i,
    wedding: /wedding|bridal|bride|mangalsutra|occasion/i,
  };
  const re = map[occasion];
  if (!re) return true;
  return re.test(product.haystack);
}

function scoreMatch(
  product: HomepageCatalogProduct,
  opts: {
    item?: string;
    type?: "gold" | "diamond";
    occasion?: string;
    maxPrice?: number;
  },
) {
  let score = 1;
  if (opts.item) {
    if (!matchesItem(product, opts.item)) return 0;
    score += 4;
  }
  if (opts.type) {
    if (!matchesType(product, opts.type)) return 0;
    score += 3;
  }
  if (opts.occasion) {
    if (matchesOccasion(product, opts.occasion)) score += 2;
    else score += 0.2;
  }
  if (typeof opts.maxPrice === "number") {
    if (product.basePrice > opts.maxPrice) return 0;
    score += 2;
  }
  if (productImage(product)) score += 1;
  return score;
}

function pickImage(
  catalog: HomepageCatalogProduct[],
  seed: number,
  salt: number,
  used: Set<string>,
  opts: {
    item?: string;
    type?: "gold" | "diamond";
    occasion?: string;
    maxPrice?: number;
  } = {},
): string | null {
  const ranked = catalog
    .map((product, index) => ({
      product,
      index,
      score: scoreMatch(product, opts),
    }))
    .filter((row) => row.score > 0 && productImage(row.product))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  if (ranked.length === 0) return null;

  const unused = ranked.filter((row) => !used.has(row.product.id));
  const pool = unused.length > 0 ? unused : ranked;
  const pick = pool[(seed + salt) % pool.length]!;
  used.add(pick.product.id);
  return productImage(pick.product);
}

/**
 * Active + approved catalogue with sellable stock (stock − reserved > 0).
 * Ordered with a time-bucket seed so homepage tiles rotate periodically.
 */
export async function getInStockHomepageCatalog(
  take = CATALOG_TAKE,
): Promise<HomepageCatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      variants: {
        some: {
          isActive: true,
          stock: { gt: 0 },
        },
      },
    },
    include: {
      category: { select: { slug: true } },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          stock: true,
          reservedStock: true,
          attributes: true,
        },
        orderBy: { price: "asc" },
      },
      images: {
        where: { kind: "IMAGE" },
        select: { url: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: Math.max(take * 2, take),
  });

  const inStock = rows
    .map((p) => {
      const haystack = [
        p.name,
        p.slug,
        p.brand,
        p.shortDescription ?? "",
        p.category?.slug ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        basePrice: Number(p.basePrice),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        thumbnail: p.thumbnail,
        attributes: p.attributes,
        categorySlug: p.category?.slug ?? null,
        shortDescription: p.shortDescription ?? null,
        images: p.images,
        variants: p.variants,
        haystack,
      } satisfies HomepageCatalogProduct;
    })
    .filter(isInStock)
    .filter((p) => Boolean(productImage(p)));

  return seededShuffle(inStock, rotationSeed()).slice(0, take);
}

export function pickFeaturedFromCatalog(
  catalog: HomepageCatalogProduct[],
  count = 8,
) {
  return seededShuffle(catalog, rotationSeed() + 17).slice(0, count);
}

/**
 * Replace static Unsplash/CMS tile images with live in-stock product photos.
 * Keeps CMS titles/hrefs; only swaps imagery when a matching product exists.
 */
export function enrichHomepageWithProductMedia(
  homepage: HomepageConfigData,
  catalog: HomepageCatalogProduct[],
): HomepageConfigData {
  if (catalog.length === 0) return homepage;

  const seed = rotationSeed();
  const used = new Set<string>();
  let salt = 0;
  const next = (opts?: Parameters<typeof pickImage>[4]) => {
    salt += 1;
    return pickImage(catalog, seed, salt, used, opts ?? {});
  };

  const collections = {
    ...homepage.collections,
    cards: homepage.collections.cards.map((card) => {
      const id = card.id.toLowerCase();
      const title = card.title.toLowerCase();
      let opts: Parameters<typeof pickImage>[4] = {};
      if (id.includes("50k") || title.includes("50k") || title.includes("30k")) {
        opts = { maxPrice: 50000, type: "diamond" };
      } else if (id.includes("earring") || title.includes("ear")) {
        opts = { item: "earrings" };
      } else if (id.includes("gold") || title.includes("gold") || title.includes("daily")) {
        opts = { type: "gold", occasion: "daily" };
      } else if (id.includes("ring") || title.includes("ring")) {
        opts = { item: "rings" };
      }
      const image = next(opts) ?? card.image;
      return { ...card, image };
    }),
  };

  const categories = {
    ...homepage.categories,
    items: homepage.categories.items.map((item) => {
      const key =
        CATEGORY_NAME_TO_ITEM[item.name.trim().toLowerCase()] ??
        item.name.trim().toLowerCase();
      const image = next({ item: key }) ?? item.image;
      return { ...item, image };
    }),
  };

  const trending = {
    ...homepage.trending,
    items: homepage.trending.items.map((item) => {
      const title = item.title.toLowerCase();
      let opts: Parameters<typeof pickImage>[4] = {};
      if (title.includes("diamond") || title.includes("everyday")) {
        opts = { type: "diamond", occasion: "daily" };
      } else if (title.includes("auspicious") || title.includes("festive")) {
        opts = { occasion: "festive" };
      } else if (title.includes("gift")) {
        opts = { maxPrice: 50000 };
      }
      const image = next(opts) ?? item.image;
      return { ...item, image };
    }),
  };

  const world = {
    ...homepage.world,
    wedding: {
      ...homepage.world.wedding,
      // Never serve the old competitor collage; keep curated VIDYORA bridal art.
      image: resolveWeddingImage(homepage.world.wedding.image),
    },
    gold: {
      ...homepage.world.gold,
      image: next({ type: "gold" }) ?? homepage.world.gold.image,
    },
  };

  const chooseYourLook = {
    ...homepage.chooseYourLook,
    looks: homepage.chooseYourLook.looks.map((look) => {
      const id = look.id.toLowerCase();
      let opts: Parameters<typeof pickImage>[4] = {};
      if (id === "evening" || id === "party") opts = { occasion: "party" };
      else if (id === "casual" || id === "office") opts = { occasion: "daily" };
      else if (id === "modern") opts = { type: "diamond" };
      else if (id === "classic") opts = { type: "gold" };
      const image = next(opts) ?? look.image;
      return { ...look, image };
    }),
  };

  const styleStories = {
    ...homepage.styleStories,
    stories: homepage.styleStories.stories.map((story) => {
      const id = story.id.toLowerCase();
      let opts: Parameters<typeof pickImage>[4] = {};
      if (id.includes("everyday") || id.includes("diamond")) {
        opts = { type: "diamond", occasion: "daily" };
      } else if (id.includes("bridal") || id.includes("wedding")) {
        opts = { occasion: "wedding" };
      } else if (id.includes("gold") || id.includes("festive")) {
        opts = { type: "gold", occasion: "festive" };
      }
      const poster = next(opts) ?? story.poster;
      return { ...story, poster };
    }),
  };

  const exploreTraditions = {
    ...homepage.exploreTraditions,
    items: homepage.exploreTraditions.items.map((item) => {
      const image = next({ occasion: "wedding" }) ?? item.image;
      return {
        ...item,
        image,
        moments: item.moments.map((moment) => ({
          ...moment,
          image: next({ occasion: "wedding" }) ?? moment.image,
        })),
      };
    }),
  };

  const weddingMoodboard = {
    ...homepage.weddingMoodboard,
    polaroids: homepage.weddingMoodboard.polaroids.map((polaroid) => ({
      ...polaroid,
      image: next({ occasion: "wedding" }) ?? polaroid.image,
    })),
  };

  return {
    ...homepage,
    collections,
    categories,
    trending,
    world,
    chooseYourLook,
    styleStories,
    exploreTraditions,
    weddingMoodboard,
  };
}

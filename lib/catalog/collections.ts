import type { ProductListParams } from "@/lib/products/product-query";

export type CollectionDefinition = {
  /** Short UI / H1 title */
  title: string;
  /** SERP title segment (template appends | VIDYORA) */
  metaTitle: string;
  /** Meta + intro description — keyword-rich, natural */
  description: string;
  /** Extra on-page SEO copy under the H1 */
  intro: string;
  keywords: string[];
  filters: ProductListParams;
};

/** Canonical landing collections used by storefront + sitemap. */
export const COLLECTION_MAP: Record<string, CollectionDefinition> = {
  "under-50k": {
    title: "Jewellery Under ₹50,000",
    metaTitle: "Buy Jewellery Under 50000 Online",
    description:
      "Shop gold, diamond and everyday jewellery under ₹50,000 on VIDYORA. Certified pieces, secure checkout and pan-India delivery.",
    intro:
      "Discover fine jewellery under ₹50,000 — rings, earrings, pendants and more curated for everyday luxury and thoughtful gifting without stretching your budget.",
    keywords: [
      "jewellery under 50000",
      "affordable diamond jewellery",
      "gold jewellery under 50k",
      "buy jewellery online India",
    ],
    filters: { maxPrice: "50000", collection: "Under 50K" },
  },
  wedding: {
    title: "Wedding Jewellery",
    metaTitle: "Wedding & Bridal Jewellery Online",
    description:
      "Shop bridal and wedding jewellery online at VIDYORA — gold and diamond sets, earrings and necklaces for shaadi, engagement and reception.",
    intro:
      "From subtle engagement favourites to statement bridal sets, explore wedding jewellery crafted for Indian celebrations — gold tone, diamond and festive looks in one place.",
    keywords: [
      "wedding jewellery",
      "bridal jewellery online",
      "shaadi jewellery",
      "engagement jewellery India",
    ],
    filters: { occasion: "wedding", collection: "Wedding Jewellery" },
  },
  diamond: {
    title: "Diamond Jewellery",
    metaTitle: "Buy Diamond Jewellery Online",
    description:
      "Shop diamond jewellery online at VIDYORA — diamond rings, earrings, pendants and necklaces with certified stones and elegant everyday designs.",
    intro:
      "Browse diamond jewellery for daily wear and occasions — solitaires, pave styles and modern cuts, listed with clear pricing so you can buy diamond jewellery online with confidence.",
    keywords: [
      "diamond jewellery online",
      "buy diamond rings",
      "diamond earrings India",
      "diamond pendant",
    ],
    filters: { type: "diamond", collection: "Diamond" },
  },
  gold: {
    title: "Gold Jewellery",
    metaTitle: "Buy Gold Jewellery Online",
    description:
      "Shop gold jewellery online at VIDYORA — gold earrings, chains, rings and festive pieces for everyday wear and celebrations across India.",
    intro:
      "Explore gold jewellery that balances tradition and modern design — lightweight daily wear and festive favourites with transparent pricing and trusted delivery.",
    keywords: [
      "gold jewellery online",
      "buy gold earrings",
      "gold rings India",
      "light weight gold jewellery",
    ],
    filters: { type: "gold", collection: "Gold" },
  },
  daily: {
    title: "Daily Wear Jewellery",
    metaTitle: "Daily Wear Jewellery Online",
    description:
      "Shop daily wear jewellery online at VIDYORA — lightweight earrings, rings and pendants for office, travel and everyday elegance.",
    intro:
      "Comfortable, stackable and work-ready — daily wear jewellery designed to go from morning meetings to evening plans without feeling heavy or overdone.",
    keywords: [
      "daily wear jewellery",
      "everyday jewellery online",
      "lightweight jewellery",
      "office wear earrings",
    ],
    filters: { occasion: "daily", collection: "Daily Wear" },
  },
  gifting: {
    title: "Jewellery Gifting",
    metaTitle: "Jewellery Gift Ideas Online",
    description:
      "Find jewellery gift ideas on VIDYORA — festive, birthday and anniversary gifts in gold and diamond, ready for pan-India delivery.",
    intro:
      "Whether it is a festival, anniversary or a just-because surprise, explore gift-ready jewellery with elegant designs and price points that make choosing easy.",
    keywords: [
      "jewellery gift ideas",
      "gift jewellery online",
      "festive jewellery gifts",
      "anniversary jewellery gift",
    ],
    filters: { occasion: "festive", collection: "Gifting" },
  },
};

export const COLLECTION_SLUGS = Object.keys(COLLECTION_MAP);

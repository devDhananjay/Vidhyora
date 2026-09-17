import type { ProductListParams } from "@/lib/products/product-query";

export type CollectionDefinition = {
  title: string;
  description: string;
  filters: ProductListParams;
};

/** Canonical landing collections used by storefront + sitemap. */
export const COLLECTION_MAP: Record<string, CollectionDefinition> = {
  "under-50k": {
    title: "Under 50K",
    description: "Fine jewellery under ₹50,000",
    filters: { maxPrice: "50000", collection: "Under 50K" },
  },
  wedding: {
    title: "Wedding Jewellery",
    description: "Bridal and wedding jewellery collections",
    filters: { occasion: "wedding", collection: "Wedding Jewellery" },
  },
  diamond: {
    title: "Diamond Jewellery",
    description: "Shop diamond jewellery on VIDYORA",
    filters: { type: "diamond", collection: "Diamond" },
  },
  gold: {
    title: "Gold Jewellery",
    description: "Shop gold jewellery on VIDYORA",
    filters: { type: "gold", collection: "Gold" },
  },
  daily: {
    title: "Daily Wear",
    description: "Everyday jewellery for daily wear",
    filters: { occasion: "daily", collection: "Daily Wear" },
  },
  gifting: {
    title: "Gifting",
    description: "Festive and gift-ready jewellery",
    filters: { occasion: "festive", collection: "Gifting" },
  },
};

export const COLLECTION_SLUGS = Object.keys(COLLECTION_MAP);

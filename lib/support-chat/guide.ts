import type { ProductFilters } from "@/types/product";

export type GuideStep = "category" | "occasion" | "recommend" | "login" | "free";

export type GuideCategoryId =
  | "rings"
  | "earrings"
  | "necklaces"
  | "gifting"
  | "help-choose"
  | "other"
  | "type";

export type GuideOccasionId =
  | "everyday"
  | "party"
  | "wedding"
  | "gift"
  | "budget";

export const GUIDE_CATEGORIES: Array<{
  id: GuideCategoryId;
  label: string;
  filters?: ProductFilters;
}> = [
  { id: "rings", label: "💍 Rings", filters: { item: ["rings"] } },
  { id: "earrings", label: "✨ Earrings", filters: { item: ["earrings"] } },
  {
    id: "necklaces",
    label: "📿 Necklaces",
    filters: { item: ["necklaces"] },
  },
  {
    id: "gifting",
    label: "🎁 Gifting",
    filters: { occasion: ["festive"] },
  },
  { id: "help-choose", label: "🔍 Help Me Choose" },
  { id: "type", label: "💬 Type your requirement" },
  { id: "other", label: "Other" },
];

export const GUIDE_OCCASIONS: Array<{
  id: GuideOccasionId;
  label: string;
  filters?: ProductFilters;
}> = [
  { id: "everyday", label: "💕 Everyday", filters: { occasion: ["daily"] } },
  { id: "party", label: "🥂 Party", filters: { occasion: ["party"] } },
  {
    id: "wedding",
    label: "💍 Wedding/Festive",
    filters: { occasion: ["wedding", "festive"] },
  },
  { id: "gift", label: "🎁 Gift", filters: { occasion: ["festive"] } },
  {
    id: "budget",
    label: "💰 Budget",
    filters: { maxPrice: 50000 },
  },
];

export const GUIDE_RECOMMEND_ACTIONS = [
  { id: "more", label: "Yes, Show More" },
  { id: "change", label: "Change Preference" },
  { id: "other", label: "Other" },
] as const;

export const PRODUCTS_ATTACHMENT_TYPE = "vidyora/products";

function asOccasionList(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function mergeGuideFilters(
  categoryId: GuideCategoryId | null,
  occasionId: GuideOccasionId | null,
): ProductFilters {
  const category = GUIDE_CATEGORIES.find((c) => c.id === categoryId);
  const occasion = GUIDE_OCCASIONS.find((o) => o.id === occasionId);
  const cat = category?.filters ?? {};
  const occ = occasion?.filters ?? {};
  const occasionValues = [
    ...asOccasionList(cat.occasion),
    ...asOccasionList(occ.occasion),
  ];
  return {
    ...cat,
    ...occ,
    ...(occasionValues.length
      ? { occasion: [...new Set(occasionValues)] }
      : {}),
  };
}

export function isGuestThreadEmail(email: string) {
  return /@guest\.vidyora$/i.test(email) || email.startsWith("guest+");
}

export function shopHrefForGuide(
  categoryId: GuideCategoryId | null,
  occasionId: GuideOccasionId | null,
) {
  const filters = mergeGuideFilters(categoryId, occasionId);
  const params = new URLSearchParams();
  if (filters.item) {
    const item = Array.isArray(filters.item) ? filters.item[0] : filters.item;
    if (item) params.set("item", item);
  }
  if (filters.occasion) {
    const occasion = Array.isArray(filters.occasion)
      ? filters.occasion.join(",")
      : filters.occasion;
    if (occasion) params.set("occasion", occasion);
  }
  if (filters.maxPrice != null) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

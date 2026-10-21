/** Map VIDYORA category slugs → Meesho jewellery leaf categories. */
export type MeeshoCategoryKey =
  | "Rings"
  | "Pendants & Lockets"
  | "Necklaces & Chains"
  | "Earrings & Studs"
  | "Bracelet & Bangles"
  | "Anklets & Toe Rings"
  | "Mangalsutras"
  | "Nosepins"
  | "Jewellery Set";

const SLUG_MAP: Record<string, MeeshoCategoryKey> = {
  rings: "Rings",
  pendants: "Pendants & Lockets",
  necklaces: "Necklaces & Chains",
  chains: "Necklaces & Chains",
  choker: "Necklaces & Chains",
  earrings: "Earrings & Studs",
  studs: "Earrings & Studs",
  hoops: "Earrings & Studs",
  drops: "Earrings & Studs",
  jhumkas: "Earrings & Studs",
  bracelets: "Bracelet & Bangles",
  bangles: "Bracelet & Bangles",
  kadas: "Bracelet & Bangles",
  anklets: "Anklets & Toe Rings",
  mangalsutra: "Mangalsutras",
  nosepin: "Nosepins",
  sets: "Jewellery Set",
};

export function mapCategorySlugToMeesho(
  slug: string | null | undefined,
): MeeshoCategoryKey | null {
  if (!slug) return null;
  return SLUG_MAP[slug.toLowerCase()] ?? null;
}

/** Max SKUs Meesho allows per catalog (single/bulk group). */
export const MEESHO_MAX_SKUS_PER_CATALOG = 9;

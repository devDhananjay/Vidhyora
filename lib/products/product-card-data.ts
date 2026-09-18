import { isVideoUrl } from "@/lib/media/is-video-url";

export function isBestSellerFlag(attributes: unknown) {
  if (!attributes || typeof attributes !== "object") return false;
  return (attributes as { bestSeller?: boolean }).bestSeller === true;
}

function asAttrString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function normalizeKarat(value: string) {
  if (!value) return "";
  const match = value.match(/(\d{1,2})\s*K/i);
  if (match) return `${match[1]}K`;
  if (/^\d{1,2}$/.test(value)) return `${value}K`;
  return value;
}

function normalizeWeight(value: string) {
  if (!value) return "";
  if (/g(ram)?s?$/i.test(value) || /gm$/i.test(value)) return value;
  if (/^[\d.]+$/.test(value)) return `${value}g`;
  return value;
}

/** Compact metal / karat / weight line for PLP cards. */
export function jewelleryCardMeta(attributes: unknown): {
  metal?: string;
  karat?: string;
  weight?: string;
  label?: string;
} {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return {};
  }
  const source = attributes as Record<string, unknown>;
  const metalRaw =
    asAttrString(source.metal) ||
    asAttrString(source.material) ||
    asAttrString(source.colour) ||
    asAttrString(source.materialColour);
  const karat = normalizeKarat(
    asAttrString(source.karatage) ||
      asAttrString(source.karat) ||
      asAttrString(source.purity),
  );
  const weight = normalizeWeight(
    asAttrString(source.weight) || asAttrString(source.grossWeight),
  );

  let metal = metalRaw;
  if (metal) {
    if (/yellow\s*gold/i.test(metal)) metal = "Yellow Gold";
    else if (/white\s*gold/i.test(metal)) metal = "White Gold";
    else if (/rose\s*gold/i.test(metal)) metal = "Rose Gold";
    else if (/^gold$/i.test(metal)) metal = "Gold";
  }

  const parts = [metal, karat, weight].filter(Boolean);
  return {
    metal: metal || undefined,
    karat: karat || undefined,
    weight: weight || undefined,
    label: parts.length ? parts.join(" · ") : undefined,
  };
}

export function imageUrlsForProduct(input: {
  thumbnail?: string | null;
  images?: { url: string; kind?: string | null }[];
}) {
  const fromImages = (input.images ?? [])
    .filter(
      (image) =>
        image.kind?.toUpperCase() !== "VIDEO" && !isVideoUrl(image.url),
    )
    .map((image) => image.url);

  const thumb =
    input.thumbnail &&
    !isVideoUrl(input.thumbnail) &&
    !input.thumbnail.includes("placeholder")
      ? input.thumbnail
      : null;

  const urls = [thumb, ...fromImages].filter(
    (src): src is string =>
      typeof src === "string" &&
      Boolean(src) &&
      !src.includes("placeholder"),
  );
  return [...new Set(urls)];
}

/** Prisma select fragment for PLP quick-add variants. */
export const productCardVariantSelect = {
  id: true,
  stock: true,
  attributes: true,
  price: true,
} as const;

export function variantOptionLabel(attributes: unknown, fallback = "Default") {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return fallback;
  }
  const source = attributes as Record<string, unknown>;
  const sizeKey = Object.keys(source).find((key) =>
    /size|ring|bangle|circumference|diameter/i.test(key),
  );
  if (sizeKey) {
    const value = asAttrString(source[sizeKey]);
    if (value) return value;
  }
  for (const value of Object.values(source)) {
    const text = asAttrString(value);
    if (text) return text;
  }
  return fallback;
}

export function mapCardVariants(
  variants: Array<{
    id: string;
    stock: number;
    attributes: unknown;
  }>,
) {
  return variants.map((variant, index) => ({
    id: variant.id,
    stock: variant.stock,
    label: variantOptionLabel(
      variant.attributes,
      variants.length === 1 ? "Standard" : `Option ${index + 1}`,
    ),
  }));
}

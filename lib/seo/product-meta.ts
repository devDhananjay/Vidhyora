/**
 * Build storefront-facing SEO title / description for a product.
 * Prefers CMS meta fields; otherwise builds keyword-aware fallbacks
 * that match the actual catalogue (fashion / stainless steel jewellery).
 */

function cleanText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function clip(value: string, max: number) {
  if (value.length <= max) return value;
  const sliced = value.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

export type ProductSeoInput = {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryName?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export function buildProductSeoMeta(product: ProductSeoInput) {
  const name = cleanText(product.name) || "Jewellery";
  const category = cleanText(product.categoryName);
  const blurb =
    cleanText(product.shortDescription) ||
    cleanText(product.description).slice(0, 120);

  const title =
    cleanText(product.metaTitle) ||
    (category ? `${name} | ${category} Online` : `${name} | Buy Online`);

  const storedDesc = cleanText(product.metaDescription);
  const description =
    storedDesc ||
    clip(
      [
        blurb || `Shop ${name} from Vidyora by Vidushi.`,
        category ? `${category} in stainless steel.` : "Stainless steel fashion jewellery.",
        "Hypoallergenic daily wear · Free shipping on orders over ₹500.",
      ]
        .filter(Boolean)
        .join(" "),
      158,
    );

  return { title, description };
}

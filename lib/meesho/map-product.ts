import { getSiteUrl } from "@/lib/site-url";
import {
  mapCategorySlugToMeesho,
  type MeeshoCategoryKey,
} from "@/lib/meesho/categories";
import {
  buildSafeMeeshoDescription,
  sanitizeMeeshoDescription,
  sanitizeMeeshoProductName,
} from "@/lib/meesho/sanitize";

export type MeeshoMappedRow = {
  productId: string;
  variantId: string;
  sku: string;
  meeshoCategory: MeeshoCategoryKey;
  productName: string;
  variation: string;
  meeshoPrice: number;
  wrongDefectivePrice: number;
  mrp: number;
  netWeightGms: number;
  inventory: number;
  countryOfOrigin: string;
  manufacturerName: string;
  manufacturerAddress: string;
  manufacturerPincode: string;
  packerName: string;
  packerAddress: string;
  packerPincode: string;
  baseMetal: string;
  color: string;
  genericName: string;
  netQuantity: number;
  occasion: string;
  plating: string;
  productDiameter: number;
  productDimensionUnit: string;
  sizing: string;
  stoneType: string;
  type: string;
  image1: string;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  brandName: string;
  /** Leave blank — Meesho Brand dropdown must match their list. */
  brand: string;
  productDescription: string;
  groupId: string;
  hsn: string;
  gstPercent: number;
};

type MapInput = {
  product: {
    id: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
    brand: string;
    basePrice: { toString(): string } | number;
    compareAtPrice: { toString(): string } | number | null;
    tax: { toString(): string } | number;
    hsn: string | null;
    category: { slug: string; name: string };
    images: Array<{ url: string; sortOrder: number; kind?: string | null }>;
  };
  variant: {
    id: string;
    sku: string;
    price: { toString(): string } | number;
    compareAtPrice: { toString(): string } | number | null;
    stock: number;
    weight: { toString(): string } | number | null;
    attributes: unknown;
  };
  groupId: string;
};

function num(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value.toString());
}

function absoluteImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

function pickImages(images: MapInput["product"]["images"]) {
  const urls = images
    .filter((img) => !img.kind || img.kind === "IMAGE")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => absoluteImageUrl(img.url));
  return {
    image1: urls[0] || "",
    image2: urls[1] || null,
    image3: urls[2] || null,
    image4: urls[3] || null,
  };
}

function detectSizing(attrs: unknown, name: string): string {
  const blob = `${JSON.stringify(attrs || {})} ${name}`.toLowerCase();
  if (blob.includes("adjustable") || blob.includes("open")) return "Adjustable";
  return "Non-Adjustable";
}

function detectColor(attrs: unknown, name: string): string {
  const blob = `${JSON.stringify(attrs || {})} ${name}`.toLowerCase();
  if (blob.includes("silver") || blob.includes("white")) return "Silver";
  if (blob.includes("rose")) return "Pink";
  if (blob.includes("purple") || blob.includes("violet")) return "Purple";
  if (blob.includes("black")) return "Black";
  return "Gold";
}

function meeshoTypeForCategory(category: MeeshoCategoryKey): string {
  switch (category) {
    case "Rings":
      return "Finger Ring";
    case "Earrings & Studs":
      return "Studs";
    default:
      return category;
  }
}

/**
 * Meesho listing price: ~70% of site price (matches current VIDYORA Meesho listings).
 * Override with MEESHO_PRICE_RATIO env (e.g. 0.75).
 */
export function computeMeeshoPrice(sitePrice: number): number {
  const ratio = Number(process.env.MEESHO_PRICE_RATIO || "0.7");
  const safe = Number.isFinite(ratio) && ratio > 0 && ratio <= 1 ? ratio : 0.7;
  return Math.max(49, Math.round(sitePrice * safe));
}

export function mapProductToMeeshoRow(input: MapInput): MeeshoMappedRow {
  const meeshoCategory = mapCategorySlugToMeesho(input.product.category.slug);
  if (!meeshoCategory) {
    throw new Error(
      `No Meesho category mapping for slug "${input.product.category.slug}"`,
    );
  }

  const sitePrice = num(input.variant.price) || num(input.product.basePrice);
  const mrp =
    num(input.variant.compareAtPrice) ||
    num(input.product.compareAtPrice) ||
    Math.max(sitePrice, Math.round(sitePrice * 1.4));
  const meeshoPrice = computeMeeshoPrice(sitePrice);
  const wrongDefectivePrice = Math.max(39, meeshoPrice - 5);

  const productName = sanitizeMeeshoProductName(input.product.name);
  const rawDesc =
    input.product.shortDescription ||
    input.product.description ||
    buildSafeMeeshoDescription({ name: productName });
  const productDescription = sanitizeMeeshoDescription(rawDesc);
  const images = pickImages(input.product.images);

  if (!images.image1) {
    throw new Error("Product needs at least one image for Meesho listing");
  }

  const weightGms = num(input.variant.weight);
  const manufacturerAddress =
    process.env.MEESHO_MFG_ADDRESS ||
    "VIDYORA, India";
  const manufacturerPincode = process.env.MEESHO_MFG_PINCODE || "110001";

  return {
    productId: input.product.id,
    variantId: input.variant.id,
    sku: input.variant.sku,
    meeshoCategory,
    productName,
    variation: "Free Size",
    meeshoPrice,
    wrongDefectivePrice,
    mrp: Math.max(mrp, meeshoPrice + 1),
    netWeightGms: weightGms > 0 ? Math.round(weightGms) : 10,
    inventory: Math.max(0, input.variant.stock),
    countryOfOrigin: "India",
    manufacturerName: "VIDYORA",
    manufacturerAddress,
    manufacturerPincode,
    packerName: "VIDYORA",
    packerAddress: manufacturerAddress,
    packerPincode: manufacturerPincode,
    baseMetal: "Alloy",
    color: detectColor(input.variant.attributes, input.product.name),
    genericName: meeshoCategory === "Rings" ? "Rings" : meeshoCategory,
    netQuantity: 1,
    occasion: "Western Casual",
    plating: "Gold Plated",
    productDiameter: 17,
    productDimensionUnit: "mm",
    sizing: detectSizing(input.variant.attributes, input.product.name),
    stoneType: "American Diamond",
    type: meeshoTypeForCategory(meeshoCategory),
    image1: images.image1,
    image2: images.image2,
    image3: images.image3,
    image4: images.image4,
    brandName: "VIDYORA",
    brand: "",
    productDescription,
    groupId: input.groupId,
    hsn: input.product.hsn || "7117",
    gstPercent: num(input.product.tax) || 3,
  };
}

export const MEESHO_CSV_COLUMNS: Array<{ key: keyof MeeshoMappedRow; header: string }> = [
  { key: "productName", header: "Product Name" },
  { key: "variation", header: "Variation" },
  { key: "meeshoPrice", header: "Meesho Price" },
  { key: "wrongDefectivePrice", header: "Wrong/Defective Returns Price" },
  { key: "mrp", header: "MRP" },
  { key: "netWeightGms", header: "Net Weight (gms)" },
  { key: "inventory", header: "Inventory" },
  { key: "countryOfOrigin", header: "Country of Origin" },
  { key: "manufacturerName", header: "Manufacturer Name" },
  { key: "manufacturerAddress", header: "Manufacturer Address" },
  { key: "manufacturerPincode", header: "Manufacturer Pincode" },
  { key: "packerName", header: "Packer Name" },
  { key: "packerAddress", header: "Packer Address" },
  { key: "packerPincode", header: "Packer Pincode" },
  { key: "baseMetal", header: "Base Metal" },
  { key: "color", header: "Color" },
  { key: "genericName", header: "Generic Name" },
  { key: "netQuantity", header: "Net Quantity (N)" },
  { key: "occasion", header: "Occasion" },
  { key: "plating", header: "Plating" },
  { key: "productDiameter", header: "Product Diameter" },
  { key: "productDimensionUnit", header: "Product Dimension Unit" },
  { key: "sizing", header: "Sizing" },
  { key: "stoneType", header: "Stone Type" },
  { key: "type", header: "Type" },
  { key: "image1", header: "Image 1 (Front)" },
  { key: "image2", header: "Image 2" },
  { key: "image3", header: "Image 3" },
  { key: "image4", header: "Image 4" },
  { key: "sku", header: "SKU ID" },
  { key: "brandName", header: "Brand Name" },
  { key: "groupId", header: "Group ID" },
  { key: "productDescription", header: "Product Description" },
  { key: "brand", header: "Brand" },
];

export function rowsToCsv(rows: MeeshoMappedRow[]): string {
  const escape = (value: unknown) => {
    const raw = value == null ? "" : String(value);
    if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };
  const header = MEESHO_CSV_COLUMNS.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) =>
      MEESHO_CSV_COLUMNS.map((c) => escape(row[c.key])).join(","),
    )
    .join("\n");
  return `${header}\n${body}\n`;
}

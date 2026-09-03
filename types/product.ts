import type { Product, ProductVariant } from "@prisma/client";

export type { Product, ProductVariant };

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

export type ProductListItem = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "brand"
  | "basePrice"
  | "compareAtPrice"
  | "thumbnail"
  | "approvalStatus"
> & {
  averageRating?: number;
  reviewCount?: number;
};

export type ProductFilters = {
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: "price-low" | "price-high" | "newest" | "rating" | "popular";
  page?: number;
  q?: string;
};

export type CategoryAttributeDefinition = {
  name: string;
  slug: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  isRequired?: boolean;
  isFilterable?: boolean;
};

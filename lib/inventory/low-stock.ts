export const DEFAULT_LOW_STOCK_THRESHOLD = 3;

export type LowStockVariant = {
  variantId: string;
  sku: string;
  stock: number;
  reservedStock: number;
  available: number;
  productId: string;
  productName: string;
  productSlug: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string | null;
};

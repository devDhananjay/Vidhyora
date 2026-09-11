import type { Cart, CartItem, Product, ProductVariant } from "@prisma/client";

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
    variant: ProductVariant;
  })[];
};

export type CartItemWithDetails = CartItem & {
  product: Product;
  variant: ProductVariant;
};

export type CartSummary = {
  subtotal: number;
  mrpTotal: number;
  productDiscount: number;
  tax: number;
  shipping: number;
  giftPackaging: number;
  discount: number;
  couponCode: string | null;
  total: number;
  itemCount: number;
  freeShippingThreshold: number;
  shippingFee: number;
  fastDeliveryFee: number;
  fastDeliveryEnabled: boolean;
  gstPercent: number;
  youSave: number;
};

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
  tax: number;
  shipping: number;
  discount: number;
  couponCode: string | null;
  total: number;
  itemCount: number;
};

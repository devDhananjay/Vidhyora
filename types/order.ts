import type { Order, OrderItem, Product, ProductVariant, Address, Review } from "@prisma/client";

export type OrderWithDetails = Order & {
  items: (OrderItem & {
    product: Product;
    variant: ProductVariant;
    reviews: Review[];
  })[];
  shippingAddress: Address;
  billingAddress: Address | null;
};

export type OrderItemWithDetails = OrderItem & {
  product: Product;
  variant: ProductVariant;
  reviews: Review[];
};

export type OrderSummary = {
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
};

import type {
  Address,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductVariant,
  Review,
  Shipment,
} from "@prisma/client";

export type OrderWithDetails = Order & {
  items: (OrderItem & {
    product: Product;
    variant: ProductVariant;
    reviews: Review[];
  })[];
  shippingAddress: Address;
  billingAddress: Address | null;
  payments?: Payment[];
  shipments?: Shipment[];
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

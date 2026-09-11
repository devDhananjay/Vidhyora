import type {
  Address,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductVariant,
  ReturnRequest,
  Review,
  Shipment,
} from "@prisma/client";

export type OrderWithDetails = Order & {
  items: (OrderItem & {
    product: Pick<Product, "id" | "name" | "slug" | "thumbnail"> | Product;
    variant: Pick<ProductVariant, "id" | "sku" | "attributes" | "price"> | ProductVariant;
    reviews: Pick<Review, "id">[] | Review[];
    returnRequests?: Pick<
      ReturnRequest,
      "id" | "status" | "type" | "reason" | "adminNote" | "rejectedAt"
    >[];
  })[];
  shippingAddress: Address;
  billingAddress: Address | null;
  payments?: Payment[];
  shipments?: Shipment[];
};

export type OrderItemWithDetails = OrderItem & {
  product: Pick<Product, "id" | "name" | "slug" | "thumbnail"> | Product;
  variant: Pick<ProductVariant, "id" | "sku" | "attributes" | "price"> | ProductVariant;
  reviews: Pick<Review, "id">[] | Review[];
  returnRequests?: Pick<
    ReturnRequest,
    "id" | "status" | "type" | "reason" | "adminNote" | "rejectedAt"
  >[];
};

export type OrderSummary = {
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
};

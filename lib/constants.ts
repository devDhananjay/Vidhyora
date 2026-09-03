export const APP_NAME = "VIDYORA";
export const APP_DESCRIPTION =
  "VIDYORA — India's trusted destination for gold, diamond and fine jewellery.";

export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_COUNTRY = "IN";
export const DEFAULT_LOCALE = "en-IN";

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 24,
  MAX_PAGE_SIZE: 100,
} as const;

export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
  MAX_IMAGES_PER_PRODUCT: 10,
} as const;

export const ROUTES = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  account: "/account",
  wishlist: "/wishlist",
  search: "/search",
  seller: {
    root: "/seller",
    products: "/seller/products",
    orders: "/seller/orders",
  },
  admin: {
    root: "/admin",
    sellers: "/admin/sellers",
    products: "/admin/products",
    categories: "/admin/categories",
  },
  auth: {
    login: "/login",
    register: "/register",
    sellerRegister: "/seller/register",
  },
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  ORDERED: "Ordered",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURN_APPROVED: "Return Approved",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export const PRODUCT_APPROVAL_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

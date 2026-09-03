export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD${timestamp.slice(-8)}${random}`;
}

export function calculateOrderTotals(items: Array<{ price: number; quantity: number; tax: number }>) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = items.reduce((sum, item) => sum + Number(item.tax) * item.quantity, 0);
  
  // Shipping logic: Free for orders >= ₹500
  const shippingFee = subtotal >= 500 ? 0 : 50;
  
  const total = subtotal + tax + shippingFee;

  return {
    subtotal,
    tax,
    shippingFee,
    total,
    discount: 0, // Can be extended for coupon support
  };
}

export function canCancelOrder(orderStatus: string): boolean {
  return ["ORDERED", "CONFIRMED"].includes(orderStatus);
}

export function canRequestReturn(orderStatus: string, deliveredAt: Date | null, returnWindowDays: number): boolean {
  if (orderStatus !== "DELIVERED" || !deliveredAt) {
    return false;
  }

  const windowEnd = new Date(deliveredAt);
  windowEnd.setDate(windowEnd.getDate() + returnWindowDays);

  return new Date() <= windowEnd;
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ORDERED: "Order Placed",
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

  return labels[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ORDERED: "blue",
    CONFIRMED: "blue",
    PACKED: "purple",
    SHIPPED: "indigo",
    OUT_FOR_DELIVERY: "cyan",
    DELIVERED: "green",
    CANCELLED: "red",
    RETURN_REQUESTED: "orange",
    RETURN_APPROVED: "orange",
    RETURNED: "orange",
    REFUNDED: "green",
  };

  return colors[status] || "gray";
}

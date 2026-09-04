import type { CartWithItems, CartSummary } from "@/types/cart";

const TAX_RATE = 0.18; // 18% GST
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 50;

export function calculateCartSubtotal(cart: CartWithItems): number {
  const items = cart.items.filter((item) => !item.savedForLater);

  return items.reduce((sum, item) => {
    const price = Number(item.variant.price);
    return sum + price * item.quantity;
  }, 0);
}

export function calculateCartSummary(
  cart: CartWithItems,
  options?: { discount?: number; couponCode?: string | null },
): CartSummary {
  const items = cart.items.filter((item) => !item.savedForLater);

  const subtotal = calculateCartSubtotal(cart);
  const discount = Math.min(Math.max(0, options?.discount ?? 0), subtotal);
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = Math.max(0, subtotal + tax + shipping - discount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    shipping,
    discount,
    couponCode: discount > 0 ? (options?.couponCode ?? null) : null,
    total,
    itemCount,
  };
}

export function getCartItemCount(cart: CartWithItems): number {
  return cart.items
    .filter((item) => !item.savedForLater)
    .reduce((sum, item) => sum + item.quantity, 0);
}

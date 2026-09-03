import type { CartWithItems, CartSummary } from "@/types/cart";

const TAX_RATE = 0.18; // 18% GST
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 50;

export function calculateCartSummary(cart: CartWithItems): CartSummary {
  const items = cart.items.filter((item) => !item.savedForLater);

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.variant.price);
    return sum + price * item.quantity;
  }, 0);

  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shipping;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    shipping,
    total,
    itemCount,
  };
}

export function getCartItemCount(cart: CartWithItems): number {
  return cart.items
    .filter((item) => !item.savedForLater)
    .reduce((sum, item) => sum + item.quantity, 0);
}

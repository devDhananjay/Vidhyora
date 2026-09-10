import { giftPackagingFeeForItems } from "@/lib/cart/gift-packaging";
import { taxAmountFromGross } from "@/lib/tax/jewellery-gst";
import { DEFAULT_COMMERCE_SETTINGS } from "@/lib/validations/site-settings";
import type { CartWithItems, CartSummary } from "@/types/cart";

export function calculateCartSubtotal(cart: CartWithItems): number {
  const items = cart.items.filter((item) => !item.savedForLater);

  return items.reduce((sum, item) => {
    const price = Number(item.variant.price);
    return sum + price * item.quantity;
  }, 0);
}

export function calculateCartSummary(
  cart: CartWithItems,
  options?: {
    discount?: number;
    couponCode?: string | null;
    freeShippingThreshold?: number;
    shippingFee?: number;
    gstPercent?: number;
  },
): CartSummary {
  const items = cart.items.filter((item) => !item.savedForLater);
  const freeShippingThreshold =
    options?.freeShippingThreshold ??
    DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold;
  const shippingFee =
    options?.shippingFee ?? DEFAULT_COMMERCE_SETTINGS.shippingFee;
  const gstPercent =
    options?.gstPercent ?? DEFAULT_COMMERCE_SETTINGS.gstPercent;

  const subtotal = calculateCartSubtotal(cart);
  const discount = Math.min(Math.max(0, options?.discount ?? 0), subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const tax = items.reduce((sum, item) => {
    const lineGross = Number(item.variant.price) * item.quantity;
    const share = subtotal > 0 ? lineGross / subtotal : 0;
    const lineTaxable = Math.max(0, lineGross - discount * share);
    return sum + taxAmountFromGross(lineTaxable, Number(item.product.tax));
  }, 0);
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const giftPackaging = giftPackagingFeeForItems(items);
  const total = Math.max(0, taxable + tax + shipping + giftPackaging);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax: Math.round((tax + Number.EPSILON) * 100) / 100,
    shipping,
    giftPackaging,
    discount,
    couponCode: discount > 0 ? (options?.couponCode ?? null) : null,
    total: Math.round((total + Number.EPSILON) * 100) / 100,
    itemCount,
    freeShippingThreshold,
    shippingFee,
    gstPercent,
  };
}

export function getCartItemCount(cart: CartWithItems): number {
  return cart.items
    .filter((item) => !item.savedForLater)
    .reduce((sum, item) => sum + item.quantity, 0);
}

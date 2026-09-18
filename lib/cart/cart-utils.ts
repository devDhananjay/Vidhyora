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

export function calculateCartMrpTotal(cart: CartWithItems): number {
  const items = cart.items.filter((item) => !item.savedForLater);

  return items.reduce((sum, item) => {
    const selling = Number(item.variant.price);
    const mrp = Number(
      item.variant.compareAtPrice ??
        item.product.compareAtPrice ??
        selling,
    );
    return sum + Math.max(mrp, selling) * item.quantity;
  }, 0);
}

export function calculateCartSummary(
  cart: CartWithItems,
  options?: {
    discount?: number;
    couponCode?: string | null;
    freeShippingThreshold?: number;
    shippingFee?: number;
    fastDeliveryFee?: number;
    fastDeliveryEnabled?: boolean;
    useFastDelivery?: boolean;
    gstPercent?: number;
  },
): CartSummary {
  const items = cart.items.filter((item) => !item.savedForLater);
  const freeShippingThreshold =
    options?.freeShippingThreshold ??
    DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold;
  const shippingFee =
    options?.shippingFee ?? DEFAULT_COMMERCE_SETTINGS.shippingFee;
  const fastDeliveryFee =
    options?.fastDeliveryFee ?? DEFAULT_COMMERCE_SETTINGS.fastDeliveryFee;
  const fastDeliveryEnabled =
    options?.fastDeliveryEnabled ??
    DEFAULT_COMMERCE_SETTINGS.fastDeliveryEnabled;
  const gstPercent =
    options?.gstPercent ?? DEFAULT_COMMERCE_SETTINGS.gstPercent;

  const subtotal = calculateCartSubtotal(cart);
  const mrpTotal = calculateCartMrpTotal(cart);
  const productDiscount = Math.max(0, mrpTotal - subtotal);
  const discount = Math.min(Math.max(0, options?.discount ?? 0), subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const tax = items.reduce((sum, item) => {
    const lineGross = Number(item.variant.price) * item.quantity;
    const share = subtotal > 0 ? lineGross / subtotal : 0;
    const lineTaxable = Math.max(0, lineGross - discount * share);
    return sum + taxAmountFromGross(lineTaxable, Number(item.product.tax));
  }, 0);

  const baseShipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const fastExtra =
    fastDeliveryEnabled && options?.useFastDelivery ? fastDeliveryFee : 0;
  const shipping = baseShipping + fastExtra;
  const giftPackaging = giftPackagingFeeForItems(items);
  const total = Math.max(0, taxable + tax + shipping + giftPackaging);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const freeShippingSave =
    baseShipping === 0 && subtotal >= freeShippingThreshold ? shippingFee : 0;
  const youSave = productDiscount + discount + freeShippingSave;

  return {
    subtotal,
    mrpTotal,
    productDiscount,
    tax: Math.round((tax + Number.EPSILON) * 100) / 100,
    shipping,
    giftPackaging,
    discount,
    couponCode: discount > 0 ? (options?.couponCode ?? null) : null,
    total: Math.round((total + Number.EPSILON) * 100) / 100,
    itemCount,
    freeShippingThreshold,
    shippingFee,
    fastDeliveryFee,
    fastDeliveryEnabled,
    gstPercent,
    youSave: Math.round((youSave + Number.EPSILON) * 100) / 100,
  };
}

export function getCartItemCount(cart: CartWithItems): number {
  return cart.items
    .filter((item) => !item.savedForLater)
    .reduce((sum, item) => sum + item.quantity, 0);
}

/** True when any active line exceeds available stock (including fully OOS). */
export function cartHasStockIssue(cart: CartWithItems): boolean {
  return cart.items
    .filter((item) => !item.savedForLater)
    .some((item) => {
      const available = item.variant.stock - item.variant.reservedStock;
      return available < item.quantity;
    });
}

export function cartStockIssueMessage(cart: CartWithItems): string | null {
  for (const item of cart.items.filter((i) => !i.savedForLater)) {
    const available = item.variant.stock - item.variant.reservedStock;
    if (available <= 0) {
      return `Remove out-of-stock items to checkout (${item.product.name})`;
    }
    if (available < item.quantity) {
      return `${item.product.name} — only ${available} left. Update quantity to continue.`;
    }
  }
  return null;
}

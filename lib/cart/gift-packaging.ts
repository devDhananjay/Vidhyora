/** Flat fee (INR) when gift packaging is selected for a cart line. */
export const GIFT_PACKAGING_FEE = 30;

export const GIFT_PACKAGING_LABEL = "Gift Packaging";

export function giftPackagingFeeForItems(
  items: Array<{ giftPackaging?: boolean | null; savedForLater?: boolean }>,
): number {
  return items.reduce((sum, item) => {
    if (item.savedForLater) return sum;
    return sum + (item.giftPackaging ? GIFT_PACKAGING_FEE : 0);
  }, 0);
}

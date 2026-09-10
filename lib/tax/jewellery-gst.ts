/** Jewellery GST on VIDYORA — keep cart, checkout, PDP and invoices in sync. */
export const JEWELLERY_GST_PERCENT = 3;

export function resolveGstPercent(productTaxField?: number | null): number {
  const value = Number(productTaxField ?? 0);
  if (Number.isFinite(value) && value > 0 && value <= 40) {
    return value;
  }
  return JEWELLERY_GST_PERCENT;
}

export function taxAmountFromGross(
  gross: number,
  productTaxField?: number | null,
): number {
  const rate = resolveGstPercent(productTaxField);
  return Math.round(((gross * rate) / 100 + Number.EPSILON) * 100) / 100;
}

export const DEFAULT_HSN = "711319";

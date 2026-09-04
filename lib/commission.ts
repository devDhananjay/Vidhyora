export const DEFAULT_COMMISSION_PERCENTAGE = 10;

export function resolveCommissionRate(options: {
  categoryRate?: number | null;
  sellerRate?: number | null;
}): number {
  if (
    options.categoryRate != null &&
    Number.isFinite(options.categoryRate) &&
    options.categoryRate >= 0
  ) {
    return options.categoryRate;
  }

  if (
    options.sellerRate != null &&
    Number.isFinite(options.sellerRate) &&
    options.sellerRate >= 0
  ) {
    return options.sellerRate;
  }

  return DEFAULT_COMMISSION_PERCENTAGE;
}

export function splitSale(gross: number, rate: number) {
  const safeGross = Number.isFinite(gross) ? gross : 0;
  const safeRate = Number.isFinite(rate) ? rate : DEFAULT_COMMISSION_PERCENTAGE;
  const commissionAmount = Math.round(((safeGross * safeRate) / 100) * 100) / 100;
  const netAmount = Math.round((safeGross - commissionAmount) * 100) / 100;
  return { commissionAmount, netAmount };
}

import { resolveGstPercent } from "@/lib/tax/jewellery-gst";

export type JewelleryBreakupSnapshot = {
  metalLabel: string;
  weightGrams: number;
  ratePerGram: number;
  metalValue: number;
  making: number;
  makingShare: number;
  taxable: number;
  gst: number;
  gstRate: number;
  lineTotal: number;
  source: "attributes" | "estimated";
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseWeightGrams(weight: string): number {
  if (!weight) return 0;
  const match = weight.replace(",", "").match(/([\d.]+)/);
  return match ? Number(match[1]) : 0;
}

/**
 * Build metal / making / GST breakup for a unit price (tax-inclusive catalogue price).
 * Uses seller attributes when present; otherwise estimates making at 22%.
 */
export function buildJewelleryBreakup(input: {
  unitPrice: number;
  quantity?: number;
  taxField?: number | null;
  attributes?: unknown;
}): JewelleryBreakupSnapshot {
  const qty = Math.max(1, input.quantity ?? 1);
  const gstRate = resolveGstPercent(input.taxField);
  const attrs =
    input.attributes && typeof input.attributes === "object"
      ? (input.attributes as Record<string, unknown>)
      : {};

  const metal = asString(attrs.metal);
  const purity = asString(attrs.purity) || asString(attrs.karatage);
  const weightStr =
    asString(attrs.weight) || asString(attrs.grossWeight);
  const weightFromAttr = asNumber(attrs.weightGrams) || parseWeightGrams(weightStr);
  const makingPercentAttr = asNumber(
    attrs.makingChargePercent ?? attrs.makingPercent,
  );
  const makingAmountAttr = asNumber(
    attrs.makingCharge ?? attrs.makingChargeAmount,
  );
  const ratePerGramAttr = asNumber(attrs.metalRatePerGram ?? attrs.ratePerGram);

  const inclusive = Number(input.unitPrice) * qty;
  const taxable = inclusive / (1 + gstRate / 100);
  const gst = Math.round((inclusive - taxable + Number.EPSILON) * 100) / 100;

  let making: number;
  let metalValue: number;
  let ratePerGram: number;
  let source: "attributes" | "estimated" = "estimated";
  let makingShare = 0.22;

  if (makingAmountAttr > 0) {
    making = makingAmountAttr * qty;
    metalValue = Math.max(0, taxable - making);
    ratePerGram = weightFromAttr > 0 ? metalValue / weightFromAttr : ratePerGramAttr;
    makingShare = taxable > 0 ? making / taxable : 0;
    source = "attributes";
  } else if (ratePerGramAttr > 0 && weightFromAttr > 0) {
    metalValue = ratePerGramAttr * weightFromAttr * qty;
    making = Math.max(0, taxable - metalValue);
    ratePerGram = ratePerGramAttr;
    makingShare = taxable > 0 ? making / taxable : 0;
    source = "attributes";
  } else {
    if (makingPercentAttr > 0 && makingPercentAttr < 100) {
      makingShare = makingPercentAttr / 100;
      source = "attributes";
    }
    making = taxable * makingShare;
    metalValue = taxable - making;
    ratePerGram = weightFromAttr > 0 ? metalValue / weightFromAttr : 0;
  }

  const metalLabel = [metal, purity].filter(Boolean).join(" ").trim() || "Metal";

  return {
    metalLabel,
    weightGrams: Math.round((weightFromAttr * qty + Number.EPSILON) * 1000) / 1000,
    ratePerGram: Math.round((ratePerGram + Number.EPSILON) * 100) / 100,
    metalValue: Math.round((metalValue + Number.EPSILON) * 100) / 100,
    making: Math.round((making + Number.EPSILON) * 100) / 100,
    makingShare,
    taxable: Math.round((taxable + Number.EPSILON) * 100) / 100,
    gst,
    gstRate,
    lineTotal: Math.round((inclusive + Number.EPSILON) * 100) / 100,
    source,
  };
}

export function parseJewelleryBreakup(
  raw: unknown,
): JewelleryBreakupSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.lineTotal !== "number") return null;
  return row as JewelleryBreakupSnapshot;
}

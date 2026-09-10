import { formatCurrency } from "@/lib/utils";

export type InvoiceAddress = {
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type InvoiceLineInput = {
  id: string;
  productName: string;
  sku: string;
  variantLabel?: string | null;
  quantity: number;
  price: number;
  discount: number;
  giftPackaging?: boolean;
  /** Product tax field — treated as % when between 0 and 40 */
  taxField: number;
};

export type InvoiceTaxMode = "cgst_sgst" | "igst";

export type InvoiceLine = {
  id: string;
  title: string;
  meta: string;
  quantity: number;
  gross: number;
  discount: number;
  taxable: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

export type InvoiceBreakdown = {
  lines: InvoiceLine[];
  mode: InvoiceTaxMode;
  taxRate: number;
  totals: {
    quantity: number;
    gross: number;
    discount: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function resolveTaxRate(
  orderTax: number,
  taxableBase: number,
  itemTaxFields: number[],
): number {
  const positiveRates = itemTaxFields.filter((t) => t > 0 && t <= 40);
  if (positiveRates.length > 0) {
    const avg =
      positiveRates.reduce((sum, n) => sum + n, 0) / positiveRates.length;
    return round2(avg);
  }
  if (taxableBase > 0 && orderTax > 0) {
    return round2((orderTax / taxableBase) * 100);
  }
  return 3;
}

/** Convert number to Indian-style words for invoice grand total. */
export function amountInWordsInr(amount: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function twoDigits(n: number): string {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o ? ` ${ones[o]}` : ""}`.trim();
  }

  function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const head = h ? `${ones[h]} Hundred` : "";
    const tail = rest ? twoDigits(rest) : "";
    return [head, tail].filter(Boolean).join(" ");
  }

  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1000);
  const hundred = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  let words = `${parts.join(" ")} Rupees`.replace(/\s+/g, " ").trim();
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
}

export function buildInvoiceBreakdown(input: {
  items: InvoiceLineInput[];
  orderDiscount: number;
  orderTax: number;
  shippingFee: number;
  giftPackagingFee: number;
  orderTotal: number;
  shipState?: string | null;
  sellerState?: string | null;
}): InvoiceBreakdown {
  const productGross = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const orderDiscount = Math.min(
    Math.max(0, input.orderDiscount),
    Math.max(0, productGross),
  );

  const productLinesBase = input.items.map((item) => {
    const gross = round2(item.price * item.quantity);
    const share =
      productGross > 0 ? (item.price * item.quantity) / productGross : 0;
    const allocatedDiscount = round2(orderDiscount * share + Number(item.discount));
    const taxable = round2(Math.max(0, gross - allocatedDiscount));
    return {
      id: item.id,
      title: item.productName,
      meta: [
        `SKU ${item.sku}`,
        item.variantLabel || null,
        item.giftPackaging ? "Gift packaging selected" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      quantity: item.quantity,
      gross,
      discount: allocatedDiscount,
      taxable,
      taxField: item.taxField,
    };
  });

  const feeLines: Array<{
    id: string;
    title: string;
    meta: string;
    quantity: number;
    gross: number;
    discount: number;
    taxable: number;
    taxField: number;
  }> = [];

  if (input.shippingFee > 0) {
    feeLines.push({
      id: "shipping",
      title: "Shipping / Delivery fee",
      meta: "Delivery charges",
      quantity: 1,
      gross: round2(input.shippingFee),
      discount: 0,
      taxable: round2(input.shippingFee),
      taxField: 0,
    });
  }

  if (input.giftPackagingFee > 0) {
    feeLines.push({
      id: "gift-packaging",
      title: "Gift packaging",
      meta: "Special gift bag",
      quantity: 1,
      gross: round2(input.giftPackagingFee),
      discount: 0,
      taxable: round2(input.giftPackagingFee),
      taxField: 0,
    });
  }

  const allBase = [...productLinesBase, ...feeLines];
  const taxableBase = round2(
    allBase.reduce((sum, line) => sum + line.taxable, 0),
  );
  const taxRate = resolveTaxRate(
    input.orderTax,
    Math.max(
      0.01,
      productLinesBase.reduce((sum, line) => sum + line.taxable, 0),
    ),
    productLinesBase.map((line) => line.taxField),
  );

  const sellerState = (input.sellerState || "").trim().toLowerCase();
  const shipState = (input.shipState || "").trim().toLowerCase();
  const mode: InvoiceTaxMode =
    sellerState && shipState && sellerState !== shipState
      ? "igst"
      : "cgst_sgst";

  // Distribute order.tax across taxable product lines; fees stay non-taxed unless order tax exceeds product allocation.
  const productTaxable = productLinesBase.reduce(
    (sum, line) => sum + line.taxable,
    0,
  );
  let remainingTax = round2(Math.max(0, input.orderTax));

  const lines: InvoiceLine[] = allBase.map((line, index) => {
    const isProduct = index < productLinesBase.length;
    let lineTax = 0;
    if (isProduct && productTaxable > 0 && remainingTax > 0) {
      if (index === productLinesBase.length - 1) {
        lineTax = remainingTax;
      } else {
        lineTax = round2((line.taxable / productTaxable) * input.orderTax);
        remainingTax = round2(remainingTax - lineTax);
      }
    }

    const half = round2(lineTax / 2);
    const cgst = mode === "cgst_sgst" ? half : 0;
    const sgst = mode === "cgst_sgst" ? round2(lineTax - half) : 0;
    const igst = mode === "igst" ? lineTax : 0;
    const total = round2(line.taxable + lineTax);

    return {
      id: line.id,
      title: line.title,
      meta: line.meta,
      quantity: line.quantity,
      gross: line.gross,
      discount: line.discount,
      taxable: line.taxable,
      taxRate: isProduct ? taxRate : 0,
      cgst,
      sgst,
      igst,
      total,
    };
  });

  const totals = {
    quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    gross: round2(lines.reduce((sum, line) => sum + line.gross, 0)),
    discount: round2(lines.reduce((sum, line) => sum + line.discount, 0)),
    taxable: round2(lines.reduce((sum, line) => sum + line.taxable, 0)),
    cgst: round2(lines.reduce((sum, line) => sum + line.cgst, 0)),
    sgst: round2(lines.reduce((sum, line) => sum + line.sgst, 0)),
    igst: round2(lines.reduce((sum, line) => sum + line.igst, 0)),
    total: round2(input.orderTotal),
  };

  return { lines, mode, taxRate, totals };
}

export function formatInvoiceMoney(amount: number) {
  return formatCurrency(amount);
}

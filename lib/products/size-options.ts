/** Common jewellery size options for seller forms + AI. */
export const PRODUCT_SIZE_OPTIONS = [
  "Adjustable",
  "Free Size",
  "One Size",
  "Open / Adjustable",
  "16 inches",
  "18 inches",
  "20 inches",
  "22 inches",
  "24 inches",
  "2.4",
  "2.6",
  "2.8",
  "Size 6",
  "Size 8",
  "Size 10",
  "Size 12",
  "Size 14",
  "Size 16",
  "Size 18",
  "Size 20",
  "Size 22",
] as const;

export const DEFAULT_PRODUCT_SIZE = "Free Size";

/**
 * Suggest a default size from product name + category.
 * Rings → Adjustable, Bracelets → Free Size, others → common retail defaults.
 */
export function suggestProductSize(input: {
  name?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
}): string {
  const haystack = [
    input.name,
    input.categoryName,
    input.categorySlug,
  ]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");

  // Rings (open / stretch fashion rings)
  if (
    /\bfinger\s*rings?\b|\brings?\b|\bring\b/.test(haystack) &&
    !/\bnose\s*ring\b|\bear\s*ring\b/.test(haystack)
  ) {
    return "Adjustable";
  }

  // Bracelets
  if (/\bbracelets?\b/.test(haystack)) {
    return "Free Size";
  }

  // Bangles / kadas
  if (/\bbangles?\b|\bkadas?\b/.test(haystack)) {
    return "Free Size";
  }

  // Anklets
  if (/\banklets?\b|\bpayal\b|\bpajeb\b/.test(haystack)) {
    return "Free Size";
  }

  // Earrings family
  if (
    /\bearrings?\b|\bjhumkas?\b|\bstuds?\b|\bhoops?\b|\bdrops?\b/.test(
      haystack,
    )
  ) {
    return "One Size";
  }

  // Nose pins
  if (/\bnose\s*pins?\b|\bnosepin\b|\bnath\b/.test(haystack)) {
    return "One Size";
  }

  // Necklaces / chains / pendants / mangalsutra / chokers — most common length
  if (
    /\bnecklaces?\b|\bchains?\b|\bpendants?\b|\bmangalsutra\b|\bchokers?\b|\bhaar\b|\blocket\b/.test(
      haystack,
    )
  ) {
    return "18 inches";
  }

  // Sets / coins / fallback
  return "Free Size";
}

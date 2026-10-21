/**
 * Meesho QC rejects / warns on brand false-positives and restricted words.
 * Keep names + descriptions short and scrub known triggers.
 */

const NAME_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bFinger Ring\b/gi, "Ring"],
  [/\bFinger\b/gi, ""],
  [/\bDiamond\b/gi, "AD"],
  [/\bMinimalist\b/gi, "Sleek"],
  [/\bElegant\b/gi, "Graceful"],
  [/\bElegance\b/gi, "Grace"],
];

const DESC_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bfingers?\b/gi, "hand"],
  [/\bdiamond\b/gi, "stone"],
  [/\beveryday\b/gi, "daily"],
  [/\bnature\b/gi, "floral"],
  [/\bartistry\b/gi, "design"],
  [/\bwoodland\b/gi, "leafy"],
  [/\belegant\b/gi, "graceful"],
  [/\bminimalist\b/gi, "sleek"],
  [/\bV[- ]?(shaped|shape|Star|star)\b/gi, "chevron"],
  [/\bAn\b/g, "a"],
  [/\ban\b/g, "a"],
];

function collapseSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeMeeshoProductName(name: string): string {
  let next = name;
  for (const [pattern, replacement] of NAME_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  return collapseSpaces(next);
}

export function sanitizeMeeshoDescription(description: string): string {
  let next = description;
  for (const [pattern, replacement] of DESC_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  next = collapseSpaces(next);
  // Meesho prefers short copy
  if (next.length > 280) {
    next = `${next.slice(0, 277).trim()}...`;
  }
  return next;
}

/** Short safe fallback when description is empty / too risky. */
export function buildSafeMeeshoDescription(opts: {
  name: string;
  finish?: string;
}): string {
  const finish = opts.finish || "Gold finish";
  return sanitizeMeeshoDescription(
    `${finish} ${opts.name} for daily wear and festive looks.`,
  );
}

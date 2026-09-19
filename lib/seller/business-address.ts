/** Normalize seller `businessAddress` JSON (seeds use `line1`, forms use `addressLine1`). */
export type BusinessAddress = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseBusinessAddress(raw: unknown): BusinessAddress | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const addressLine1 = asString(o.addressLine1) || asString(o.line1);
  const addressLine2 = asString(o.addressLine2) || asString(o.line2) || undefined;
  const city = asString(o.city);
  const state = asString(o.state);
  const postalCode =
    asString(o.postalCode) || asString(o.pincode) || asString(o.zip);
  const country = asString(o.country) || "IN";
  if (!addressLine1 && !city && !state && !postalCode) return null;
  return {
    addressLine1,
    ...(addressLine2 ? { addressLine2 } : {}),
    city,
    state,
    postalCode,
    country,
  };
}

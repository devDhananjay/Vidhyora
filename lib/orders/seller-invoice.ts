/** Helpers to read seller business address for tax invoices. */

export type SellerInvoiceAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function parseSellerBusinessAddress(
  raw: unknown,
): SellerInvoiceAddress {
  if (!raw || typeof raw !== "object") {
    return {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
    };
  }
  const address = raw as Record<string, unknown>;
  const str = (key: string, ...alts: string[]) => {
    for (const k of [key, ...alts]) {
      const value = address[k];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  return {
    addressLine1: str("addressLine1", "line1", "address"),
    addressLine2: str("addressLine2", "line2"),
    city: str("city"),
    state: str("state"),
    postalCode: str("postalCode", "pincode", "pin"),
    country: str("country") || "IN",
  };
}

export function formatSellerBusinessAddress(raw: unknown): string {
  const address = parseSellerBusinessAddress(raw);
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country && address.country !== "IN" ? address.country : "",
  ]
    .filter(Boolean)
    .join(", ");
}

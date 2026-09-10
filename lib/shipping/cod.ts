/** Cash on Delivery eligibility by Indian pincode. */

const BLOCKED_PREFIXES = [
  // Extremely remote / special postal ranges — extend in admin later
  "744", // Andaman (optional restrict)
];

export function isValidIndianPincode(pincode: string | null | undefined): boolean {
  return /^\d{6}$/.test(String(pincode ?? "").trim());
}

export function isCodAvailableForPincode(
  pincode: string | null | undefined,
): boolean {
  const pin = String(pincode ?? "").trim();
  if (!isValidIndianPincode(pin)) return false;
  if (BLOCKED_PREFIXES.some((prefix) => pin.startsWith(prefix))) return false;
  // First digit 1–8 covers mainland India postal circles
  const first = Number(pin[0]);
  return first >= 1 && first <= 8;
}

export function codUnavailableMessage(pincode?: string | null): string {
  if (!isValidIndianPincode(pincode)) {
    return "Enter a valid 6-digit pincode for Cash on Delivery";
  }
  return "Cash on Delivery is not available for this pincode. Please pay online.";
}

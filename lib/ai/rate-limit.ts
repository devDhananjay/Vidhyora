/**
 * Simple per-seller rate limit for AI product assist (in-memory).
 * Resets on process restart — enough to curb abuse in MVP.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

export function assertAiRateLimit(sellerUserId: string): void {
  const now = Date.now();
  const key = sellerUserId;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (existing.count >= MAX_PER_WINDOW) {
    throw new Error(
      "AI assist limit reached for this hour. Please try again later or fill the form manually.",
    );
  }

  existing.count += 1;
  buckets.set(key, existing);
}

/**
 * Simple in-memory sliding window rate limit (single Node process / PM2 fork).
 * Keys should include action + IP (and optionally user id / email).
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const MAX_KEYS = 20_000;

function pruneIfNeeded() {
  if (store.size < MAX_KEYS) return;
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  if (store.size < MAX_KEYS) return;
  // Drop oldest half if still full
  let i = 0;
  for (const key of store.keys()) {
    store.delete(key);
    i += 1;
    if (i >= Math.floor(MAX_KEYS / 2)) break;
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  pruneIfNeeded();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  store.set(key, existing);
  return {
    ok: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: 0,
  };
}

export async function getRequestIp(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    return h.get("x-real-ip")?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export function rateLimitMessage(retryAfterSec: number) {
  return `Too many requests. Try again in ${retryAfterSec}s.`;
}

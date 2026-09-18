/**
 * In-memory TTL cache for Google Maps API responses.
 * Cuts repeat Geocoding / Places / Distance Matrix billable calls within a process.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 2000;

export function mapsCacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function mapsCacheSet<T>(key: string, value: T, ttlMs: number) {
  if (store.size >= MAX_ENTRIES) {
    // Drop oldest ~10%
    const drop = Math.ceil(MAX_ENTRIES * 0.1);
    let i = 0;
    for (const k of store.keys()) {
      store.delete(k);
      if (++i >= drop) break;
    }
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export const MAPS_TTL = {
  geocode: 1000 * 60 * 60 * 24 * 30, // 30 days
  placesSuggest: 1000 * 60 * 60 * 6, // 6 hours
  placeDetails: 1000 * 60 * 60 * 24 * 30,
  matrix: 1000 * 60 * 60 * 12, // 12 hours
} as const;

export function normalizeCacheKey(parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) =>
      String(part ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " "),
    )
    .join("|");
}

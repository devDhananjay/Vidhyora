/**
 * Server-only Google Maps helpers.
 * APIs: Geocoding, Distance Matrix, Places Autocomplete + Details.
 * Key must stay in GOOGLE_MAPS_API_KEY — never expose to the client.
 */

import { isCodAvailableForPincode } from "@/lib/shipping/cod";
import {
  MAPS_TTL,
  mapsCacheGet,
  mapsCacheSet,
  normalizeCacheKey,
} from "@/lib/google/maps-cache";

export type GeocodePlace = {
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
  /** Optional street / premise line from Places Details */
  line1?: string;
};

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function getApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }
  return key;
}

export function isGoogleMapsConfigured() {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return Boolean(key);
}

function component(
  components: AddressComponent[],
  type: string,
  useShort = false,
) {
  const match = components.find((item) => item.types.includes(type));
  if (!match) return "";
  return useShort ? match.short_name : match.long_name;
}

function extractIndianPin(text: string) {
  const match = text.match(/(?<!\d)(\d{6})(?!\d)/);
  return match?.[1] ?? "";
}

function parseGeocodeResult(result: {
  formatted_address?: string;
  address_components?: AddressComponent[];
  geometry?: { location?: { lat: number; lng: number } };
  name?: string;
}): GeocodePlace | null {
  const components = result.address_components ?? [];
  if (components.length === 0) return null;

  const city =
    component(components, "locality") ||
    component(components, "postal_town") ||
    component(components, "administrative_area_level_2") ||
    component(components, "sublocality") ||
    component(components, "sublocality_level_1");

  const state = component(components, "administrative_area_level_1");
  const postalCode =
    component(components, "postal_code") ||
    extractIndianPin(result.formatted_address ?? "");
  const premise =
    [
      component(components, "street_number"),
      component(components, "route"),
      component(components, "premise"),
      component(components, "sublocality_level_1"),
      component(components, "sublocality"),
    ]
      .filter(Boolean)
      .join(", ") || result.name || "";

  return {
    city,
    state,
    postalCode,
    formattedAddress: result.formatted_address ?? "",
    lat: result.geometry?.location?.lat ?? null,
    lng: result.geometry?.location?.lng ?? null,
    line1: premise || undefined,
  };
}

async function geocode(params: URLSearchParams) {
  const cacheKey = normalizeCacheKey(["geocode", params.toString()]);
  const cached = mapsCacheGet<GeocodePlace | null>(cacheKey);
  if (cached !== undefined) return cached;

  const key = getApiKey();
  params.set("key", key);
  params.set("language", "en");
  params.set("region", "in");

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { next: { revalidate: 86400 } },
  );

  if (!response.ok) {
    throw new Error("Geocoding request failed");
  }

  const data = (await response.json()) as {
    status: string;
    error_message?: string;
    results?: Array<{
      formatted_address?: string;
      address_components?: AddressComponent[];
      geometry?: { location?: { lat: number; lng: number } };
    }>;
  };

  if (data.status === "ZERO_RESULTS") {
    mapsCacheSet(cacheKey, null, MAPS_TTL.geocode);
    return null;
  }
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(data.error_message || `Geocoding failed: ${data.status}`);
  }

  const place = parseGeocodeResult(data.results[0]);
  mapsCacheSet(cacheKey, place, MAPS_TTL.geocode);
  return place;
}

export async function geocodeIndianPincode(pincode: string) {
  const pin = pincode.replace(/\D/g, "");
  if (!/^\d{6}$/.test(pin)) {
    throw new Error("Enter a valid 6-digit PIN code");
  }

  return geocode(
    new URLSearchParams({
      components: `postal_code:${pin}|country:IN`,
    }),
  );
}

export async function geocodeIndianCity(city: string) {
  const query = city.trim();
  if (query.length < 2) {
    throw new Error("Enter a city name");
  }

  return geocode(
    new URLSearchParams({
      address: query,
      components: "country:IN",
    }),
  );
}

export async function reverseGeocodeLatLng(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates");
  }

  return geocode(
    new URLSearchParams({
      latlng: `${lat},${lng}`,
    }),
  );
}

export async function geocodeSearchQuery(query: string) {
  const q = query.trim();
  if (q.length < 2) {
    throw new Error("Enter a location to search");
  }

  return geocode(
    new URLSearchParams({
      address: q,
      components: "country:IN",
    }),
  );
}

export async function geocodeFullAddress(parts: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}) {
  const address = [
    parts.line1,
    parts.line2,
    parts.city,
    parts.state,
    parts.postalCode,
    "India",
  ]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
  if (address.length < 8) return null;
  return geocodeSearchQuery(address);
}

/** Places Autocomplete (India) — use one sessionToken per typing session. */
export async function suggestIndianPlaces(
  input: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[]> {
  const q = input.trim();
  if (q.length < 3) return [];

  const cacheKey = normalizeCacheKey(["places-ac", q]);
  // Only cache when no session token (sessioned calls should stay live for billing)
  if (!sessionToken) {
    const cached = mapsCacheGet<PlaceSuggestion[]>(cacheKey);
    if (cached) return cached;
  }

  const key = getApiKey();
  const params = new URLSearchParams({
    input: q,
    components: "country:in",
    language: "en",
    key,
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("Places autocomplete failed");

  const data = (await response.json()) as {
    status: string;
    error_message?: string;
    predictions?: Array<{
      place_id: string;
      description: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
    }>;
  };

  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") {
    throw new Error(data.error_message || `Places failed: ${data.status}`);
  }

  const suggestions = (data.predictions ?? []).slice(0, 6).map((item) => ({
    placeId: item.place_id,
    description: item.description,
    mainText: item.structured_formatting?.main_text || item.description,
    secondaryText: item.structured_formatting?.secondary_text || "",
  }));

  if (!sessionToken) {
    mapsCacheSet(cacheKey, suggestions, MAPS_TTL.placesSuggest);
  }
  return suggestions;
}

export async function getIndianPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<GeocodePlace | null> {
  const id = placeId.trim();
  if (!id) throw new Error("Missing place id");

  const cacheKey = normalizeCacheKey(["place-details", id]);
  if (!sessionToken) {
    const cached = mapsCacheGet<GeocodePlace | null>(cacheKey);
    if (cached !== undefined) return cached;
  }

  const key = getApiKey();
  const params = new URLSearchParams({
    place_id: id,
    fields: "address_component,formatted_address,geometry,name",
    language: "en",
    region: "in",
    key,
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("Place details failed");

  const data = (await response.json()) as {
    status: string;
    error_message?: string;
    result?: {
      formatted_address?: string;
      address_components?: AddressComponent[];
      geometry?: { location?: { lat: number; lng: number } };
      name?: string;
    };
  };

  if (data.status !== "OK" || !data.result) {
    throw new Error(data.error_message || `Place details failed: ${data.status}`);
  }

  let place = parseGeocodeResult(data.result);
  if (!place) {
    mapsCacheSet(cacheKey, null, MAPS_TTL.placeDetails);
    return null;
  }

  // Places often omits postal_code for establishments — backfill via reverse geocode.
  if (!/^\d{6}$/.test(place.postalCode) && place.lat != null && place.lng != null) {
    try {
      const reverse = await reverseGeocodeLatLng(place.lat, place.lng);
      if (reverse) {
        place = {
          ...place,
          postalCode: reverse.postalCode || place.postalCode,
          city: place.city || reverse.city,
          state: place.state || reverse.state,
        };
      }
    } catch {
      // optional enrichment
    }
  }

  if (!/^\d{6}$/.test(place.postalCode)) {
    const fromText = extractIndianPin(place.formattedAddress);
    if (fromText) place = { ...place, postalCode: fromText };
  }

  mapsCacheSet(cacheKey, place, MAPS_TTL.placeDetails);
  return place;
}

export type DeliveryMatrixResult = {
  pincode: string;
  city: string;
  state: string;
  distanceText: string | null;
  durationText: string | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
  minDays: number;
  maxDays: number;
  etaLabel: string;
  dateRange: string;
  isFast: boolean;
  codAvailable: boolean;
};

function addBusinessDays(from: Date, days: number) {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function daysFromMatrix(
  distanceMeters: number | null,
  durationSeconds: number | null,
  processingDays = 2,
) {
  let transitDays = Math.max(1, processingDays);

  if (durationSeconds != null) {
    transitDays += Math.max(1, Math.ceil(durationSeconds / (3600 * 18)));
  } else if (distanceMeters != null) {
    const km = distanceMeters / 1000;
    if (km <= 50) transitDays += 1;
    else if (km <= 300) transitDays += 2;
    else if (km <= 800) transitDays += 3;
    else if (km <= 1500) transitDays += 4;
    else transitDays += 5;
  } else {
    transitDays += 3;
  }

  const minDays = Math.max(2, transitDays);
  const maxDays = minDays + (minDays <= 4 ? 2 : 3);
  return { minDays, maxDays, isFast: minDays <= 4 };
}

async function distanceMatrixPinToPin(originPin: string, destPin: string) {
  const cacheKey = normalizeCacheKey(["dm", originPin, destPin, "driving"]);
  const cached = mapsCacheGet<{
    distanceText: string | null;
    durationText: string | null;
    distanceMeters: number | null;
    durationSeconds: number | null;
  }>(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  const params = new URLSearchParams({
    origins: `${originPin},India`,
    destinations: `${destPin},India`,
    region: "in",
    units: "metric",
    mode: "driving",
    key,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`,
    { next: { revalidate: 3600 } },
  );

  const empty = {
    distanceText: null,
    durationText: null,
    distanceMeters: null,
    durationSeconds: null,
  };

  if (!response.ok) return empty;

  const data = (await response.json()) as {
    status: string;
    rows?: Array<{
      elements?: Array<{
        status: string;
        distance?: { text: string; value: number };
        duration?: { text: string; value: number };
      }>;
    }>;
  };

  const element = data.rows?.[0]?.elements?.[0];
  if (data.status !== "OK" || element?.status !== "OK") {
    mapsCacheSet(cacheKey, empty, MAPS_TTL.matrix);
    return empty;
  }

  const result = {
    distanceText: element.distance?.text ?? null,
    durationText: element.duration?.text ?? null,
    distanceMeters: element.distance?.value ?? null,
    durationSeconds: element.duration?.value ?? null,
  };
  mapsCacheSet(cacheKey, result, MAPS_TTL.matrix);
  return result;
}

/** Driving distance in km between two Indian PIN codes (null if unavailable). */
export async function distanceKmBetweenPins(
  originPincode: string,
  destinationPincode: string,
): Promise<number | null> {
  const origin = originPincode.replace(/\D/g, "");
  const dest = destinationPincode.replace(/\D/g, "");
  if (!/^\d{6}$/.test(origin) || !/^\d{6}$/.test(dest)) return null;
  if (origin === dest) return 0;

  try {
    const matrix = await distanceMatrixPinToPin(origin, dest);
    if (matrix.distanceMeters == null) return null;
    return Math.round((matrix.distanceMeters / 1000) * 10) / 10;
  } catch {
    return null;
  }
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export async function estimateDeliveryByPincode(
  destinationPincode: string,
  options?: { processingDays?: number; originPincode?: string },
): Promise<DeliveryMatrixResult> {
  const pin = destinationPincode.replace(/\D/g, "");
  if (!/^\d{6}$/.test(pin)) {
    throw new Error("Enter a valid 6-digit PIN code");
  }

  const processingDays =
    options?.processingDays != null && Number.isFinite(options.processingDays)
      ? Math.max(1, Math.min(14, Math.round(options.processingDays)))
      : 2;

  const place = await geocodeIndianPincode(pin);
  const originPin =
    options?.originPincode?.replace(/\D/g, "") ||
    process.env.GOOGLE_DELIVERY_ORIGIN_PIN?.replace(/\D/g, "") ||
    "110001";

  let distanceText: string | null = null;
  let durationText: string | null = null;
  let distanceMeters: number | null = null;
  let durationSeconds: number | null = null;

  try {
    const matrix = await distanceMatrixPinToPin(originPin, pin);
    distanceText = matrix.distanceText;
    durationText = matrix.durationText;
    distanceMeters = matrix.distanceMeters;
    durationSeconds = matrix.durationSeconds;
  } catch {
    // Fall through to heuristic
  }

  const { minDays, maxDays, isFast } = daysFromMatrix(
    distanceMeters,
    durationSeconds,
    processingDays,
  );
  const now = new Date();
  const start = addBusinessDays(now, minDays);
  const end = addBusinessDays(now, maxDays);

  return {
    pincode: pin,
    city: place?.city ?? "",
    state: place?.state ?? "",
    distanceText,
    durationText,
    distanceMeters,
    durationSeconds,
    distanceKm:
      distanceMeters != null
        ? Math.round((distanceMeters / 1000) * 10) / 10
        : null,
    minDays,
    maxDays,
    isFast,
    codAvailable: isCodAvailableForPincode(pin),
    etaLabel: `${minDays}–${maxDays} working days`,
    dateRange:
      formatDay(start) === formatDay(end)
        ? formatDay(start)
        : `${formatDay(start)} – ${formatDay(end)}`,
  };
}

export function deliveryOriginPin() {
  return (
    process.env.GOOGLE_DELIVERY_ORIGIN_PIN?.replace(/\D/g, "") || "110001"
  );
}

/**
 * Server-only Google Maps helpers (Geocoding + Distance Matrix).
 * Key must stay in GOOGLE_MAPS_API_KEY — never expose to the client.
 */

export type GeocodePlace = {
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
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

function component(
  components: AddressComponent[],
  type: string,
  useShort = false,
) {
  const match = components.find((item) => item.types.includes(type));
  if (!match) return "";
  return useShort ? match.short_name : match.long_name;
}

function parseGeocodeResult(result: {
  formatted_address?: string;
  address_components?: AddressComponent[];
  geometry?: { location?: { lat: number; lng: number } };
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
  const postalCode = component(components, "postal_code");

  return {
    city,
    state,
    postalCode,
    formattedAddress: result.formatted_address ?? "",
    lat: result.geometry?.location?.lat ?? null,
    lng: result.geometry?.location?.lng ?? null,
  };
}

async function geocode(params: URLSearchParams) {
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

  if (data.status === "ZERO_RESULTS") return null;
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(data.error_message || `Geocoding failed: ${data.status}`);
  }

  return parseGeocodeResult(data.results[0]);
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

export type DeliveryMatrixResult = {
  pincode: string;
  city: string;
  state: string;
  distanceText: string | null;
  durationText: string | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
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

function daysFromMatrix(distanceMeters: number | null, durationSeconds: number | null) {
  // Packing / processing buffer
  let transitDays = 2;

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

export async function estimateDeliveryByPincode(
  destinationPincode: string,
): Promise<DeliveryMatrixResult> {
  const pin = destinationPincode.replace(/\D/g, "");
  if (!/^\d{6}$/.test(pin)) {
    throw new Error("Enter a valid 6-digit PIN code");
  }

  const place = await geocodeIndianPincode(pin);
  const originPin =
    process.env.GOOGLE_DELIVERY_ORIGIN_PIN?.replace(/\D/g, "") || "110001";

  let distanceText: string | null = null;
  let durationText: string | null = null;
  let distanceMeters: number | null = null;
  let durationSeconds: number | null = null;

  try {
    const key = getApiKey();
    const params = new URLSearchParams({
      origins: `${originPin},India`,
      destinations: `${pin},India`,
      region: "in",
      units: "metric",
      mode: "driving",
      key,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`,
      { next: { revalidate: 3600 } },
    );

    if (response.ok) {
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
      if (data.status === "OK" && element?.status === "OK") {
        distanceText = element.distance?.text ?? null;
        durationText = element.duration?.text ?? null;
        distanceMeters = element.distance?.value ?? null;
        durationSeconds = element.duration?.value ?? null;
      }
    }
  } catch {
    // Fall through to pin-prefix heuristic via daysFromMatrix nulls
  }

  const { minDays, maxDays, isFast } = daysFromMatrix(
    distanceMeters,
    durationSeconds,
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
    minDays,
    maxDays,
    isFast,
    codAvailable: true,
    etaLabel: `${minDays}–${maxDays} working days`,
    dateRange:
      formatDay(start) === formatDay(end)
        ? formatDay(start)
        : `${formatDay(start)} – ${formatDay(end)}`,
  };
}

/** Public tracking URL helpers + optional Shiprocket status fetch. */

const COURIER_TRACK_URLS: Array<{
  match: RegExp;
  url: (awn: string) => string;
}> = [
  {
    match: /delhivery/i,
    url: (awn) => `https://www.delhivery.com/track/package/${encodeURIComponent(awn)}`,
  },
  {
    match: /bluedart|blue\s*dart/i,
    url: (awn) =>
      `https://www.bluedart.com/tracking?trackFor=0&trackNo=${encodeURIComponent(awn)}`,
  },
  {
    match: /dtdc/i,
    url: (awn) =>
      `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${encodeURIComponent(awn)}`,
  },
  {
    match: /india\s*post|speed\s*post|ipp/i,
    url: (awn) =>
      `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentnumber=${encodeURIComponent(awn)}`,
  },
  {
    match: /ekart/i,
    url: (awn) =>
      `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(awn)}`,
  },
  {
    match: /xpressbees|xb/i,
    url: (awn) =>
      `https://www.xpressbees.com/track?tracking_id=${encodeURIComponent(awn)}`,
  },
  {
    match: /shiprocket/i,
    url: (awn) =>
      `https://shiprocket.co/tracking/${encodeURIComponent(awn)}`,
  },
];

export function resolveTrackingUrl(
  courier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  const awn = String(trackingNumber ?? "").trim();
  if (!awn) return null;
  const name = String(courier ?? "").trim();
  if (!name) {
    // Generic fallback — many couriers accept this pattern via Google
    return `https://www.google.com/search?q=${encodeURIComponent(`${awn} tracking`)}`;
  }
  for (const entry of COURIER_TRACK_URLS) {
    if (entry.match.test(name)) return entry.url(awn);
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} ${awn} tracking`)}`;
}

export async function isShiprocketConfigured() {
  const { resolveShiprocketRuntimeConfig } = await import(
    "@/lib/content/integrations-settings"
  );
  const config = await resolveShiprocketRuntimeConfig();
  return config.enabled;
}

type ShiprocketTokenCache = { token: string; expiresAt: number };
let shiprocketToken: ShiprocketTokenCache | null = null;

async function getShiprocketToken(): Promise<string | null> {
  const { resolveShiprocketRuntimeConfig } = await import(
    "@/lib/content/integrations-settings"
  );
  const config = await resolveShiprocketRuntimeConfig();
  if (!config.enabled) return null;
  const email = config.email;
  const password = config.password;
  if (!email || !password) return null;

  if (shiprocketToken && shiprocketToken.expiresAt > Date.now()) {
    return shiprocketToken.token;
  }

  const response = await fetch(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { token?: string };
  if (!data.token) return null;
  shiprocketToken = {
    token: data.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
  };
  return data.token;
}

/** Fetch live tracking from Shiprocket when credentials are configured. */
export async function fetchShiprocketTracking(awb: string): Promise<{
  status: string;
  activities: Array<{ date: string; activity: string; location: string }>;
} | null> {
  const token = await getShiprocketToken();
  if (!token) return null;
  const response = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awb)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    tracking_data?: {
      shipment_track?: Array<{
        current_status?: string;
        shipment_track_activities?: Array<{
          date?: string;
          activity?: string;
          location?: string;
        }>;
      }>;
    };
  };
  const track = data.tracking_data?.shipment_track?.[0];
  if (!track) return null;
  return {
    status: track.current_status || "In transit",
    activities: (track.shipment_track_activities || []).map((row) => ({
      date: row.date || "",
      activity: row.activity || "",
      location: row.location || "",
    })),
  };
}

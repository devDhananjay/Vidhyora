"use client";

import { useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { haversineKm } from "@/lib/google/maps-client";
import { storeDirectionsUrl } from "@/lib/content/maps";

export type PublicStoreCard = {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  postalCode: string | null;
  phone: string;
  hours: string;
  mapUrl: string | null;
  latitude: number | null;
  longitude: number | null;
};

type StoreLocatorResultsProps = {
  stores: PublicStoreCard[];
};

/**
 * Client-side “near me” ranking using browser geolocation + haversine.
 * No Distance Matrix calls — free after coords are stored/geocoded.
 */
export function StoreLocatorResults({ stores }: StoreLocatorResultsProps) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const ranked = useMemo(() => {
    if (!origin) {
      return stores.map((store) => ({ store, km: null as number | null }));
    }
    return stores
      .map((store) => {
        if (store.latitude == null || store.longitude == null) {
          return { store, km: null as number | null };
        }
        return {
          store,
          km: haversineKm(origin, {
            lat: store.latitude,
            lng: store.longitude,
          }),
        };
      })
      .sort((a, b) => {
        if (a.km == null && b.km == null) return 0;
        if (a.km == null) return 1;
        if (b.km == null) return -1;
        return a.km - b.km;
      });
  }, [stores, origin]);

  function locate() {
    if (!navigator.geolocation) {
      setStatus("Location is not available on this device.");
      return;
    }
    setLocating(true);
    setStatus("Detecting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
        setStatus("Stores sorted by distance from you");
      },
      () => {
        setLocating(false);
        setStatus("Could not access location. Allow location access and retry.");
      },
      { enableHighAccuracy: false, timeout: 12000 },
    );
  }

  const mapQuery = ranked
    .filter((row) => row.store.latitude != null && row.store.longitude != null)
    .slice(0, 8)
    .map((row) => `${row.store.latitude},${row.store.longitude}`)
    .join("|");

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={locate}
          disabled={locating}
          className="border-brand/20 text-brand"
        >
          <Navigation className="mr-2 size-4" />
          {locating ? "Locating…" : "Sort by nearest"}
        </Button>
        {status ? (
          <p className="text-sm text-neutral-500">{status}</p>
        ) : null}
      </div>

      {mapQuery ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <iframe
            title="VIDYORA stores map"
            className="h-64 w-full md:h-80"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              ranked[0]?.store.latitude != null
                ? `${ranked[0].store.latitude},${ranked[0].store.longitude}`
                : `${ranked[0]?.store.name} ${ranked[0]?.store.city}`,
            )}&output=embed`}
          />
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {ranked.map(({ store, km }) => (
          <article
            key={store.id}
            className="rounded-xl border border-neutral-100 bg-white p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl text-neutral-900">
                  {store.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#8b2e2e]">
                  {store.city}
                </p>
              </div>
              {km != null ? (
                <span className="shrink-0 rounded-full bg-brand/5 px-2.5 py-1 text-[11px] font-medium text-brand">
                  {km < 10 ? km.toFixed(1) : Math.round(km)} km
                </span>
              ) : null}
            </div>
            <div className="mt-4 space-y-2 text-sm text-neutral-600">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  {store.address}
                  {store.postalCode ? `, ${store.postalCode}` : ""}
                </span>
              </p>
              <p>Phone: {store.phone}</p>
              <p>Hours: {store.hours}</p>
            </div>
            <a
              href={storeDirectionsUrl(store)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
            >
              Get directions
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

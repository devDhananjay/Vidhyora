"use client";

import { useEffect, useRef, useState } from "react";
import {
  lookupAddressByCoords,
  searchLocation,
} from "@/actions/maps/google-places";
import type { GeocodePlace } from "@/lib/google/maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";

export type MapCoords = {
  lat: number;
  lng: number;
};

type AddressMapPreviewProps = {
  coords: MapCoords | null;
  label?: string;
  className?: string;
  /** When true, request browser geolocation on mount if no coords yet */
  autoLocate?: boolean;
  onPlaceSelect?: (place: GeocodePlace) => void;
};

const INDIA_FALLBACK: MapCoords = { lat: 28.6139, lng: 77.209 };

export function AddressMapPreview({
  coords,
  label,
  className,
  autoLocate = true,
  onPlaceSelect,
}: AddressMapPreviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"locate" | "search" | null>(null);
  const [localCoords, setLocalCoords] = useState<MapCoords | null>(coords);
  const [localLabel, setLocalLabel] = useState<string | undefined>(label);
  const locatedOnce = useRef(false);

  useEffect(() => {
    setLocalCoords(coords);
  }, [coords]);

  useEffect(() => {
    setLocalLabel(label);
  }, [label]);

  useEffect(() => {
    if (!autoLocate || locatedOnce.current || coords) return;
    locatedOnce.current = true;
    void detectCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate, coords]);

  async function applyPlace(place: GeocodePlace, fallback?: MapCoords) {
    const nextCoords =
      typeof place.lat === "number" &&
      typeof place.lng === "number" &&
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lng)
        ? { lat: place.lat, lng: place.lng }
        : fallback ?? null;

    if (nextCoords) {
      setLocalCoords(nextCoords);
    }
    setLocalLabel(place.formattedAddress || undefined);
    onPlaceSelect?.(place);
  }

  async function detectCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocalCoords((prev) => prev ?? INDIA_FALLBACK);
      setStatus("Location unavailable — search or enter PIN below.");
      return;
    }

    setBusy("locate");
    setStatus("Detecting your location…");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocalCoords(next);

        const result = await lookupAddressByCoords(next.lat, next.lng);
        setBusy(null);
        if (!result.success) {
          setStatus(result.error);
          return;
        }
        await applyPlace(result.data, next);
        setStatus("Showing your current location");
      },
      () => {
        setBusy(null);
        setLocalCoords((prev) => prev ?? INDIA_FALLBACK);
        setStatus("Could not access location — search or enter PIN.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    );
  }

  async function runSearch() {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setStatus("Type a place name or area to search");
      return;
    }

    setBusy("search");
    setStatus(null);
    const result = await searchLocation(q);
    setBusy(null);
    if (!result.success) {
      setStatus(result.error);
      return;
    }
    await applyPlace(result.data);
    setStatus(result.data.formattedAddress || "Location found");
  }

  const mapCoords = localCoords ?? INDIA_FALLBACK;
  // OpenStreetMap embed — no client Maps API key; Google Embed API needs a public key.
  const delta = 0.02;
  const bbox = [
    mapCoords.lng - delta,
    mapCoords.lat - delta,
    mapCoords.lng + delta,
    mapCoords.lat + delta,
  ].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${mapCoords.lat},${mapCoords.lng}`)}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${mapCoords.lat},${mapCoords.lng}`)}&z=15`;

  return (
    <div
      className={
        className ??
        "overflow-hidden rounded-xl border border-neutral-200 bg-white"
      }
    >
      <div className="flex flex-col gap-2 border-b border-neutral-100 p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="Search location (area, landmark, city)"
            className="pl-9"
            disabled={busy !== null}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            className="gap-1.5"
            onClick={() => void runSearch()}
          >
            {busy === "search" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            className="gap-1.5"
            onClick={() => void detectCurrentLocation()}
          >
            {busy === "locate" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Crosshair className="size-3.5" />
            )}
            Current
          </Button>
        </div>
      </div>

      <div className="relative aspect-[16/10] w-full bg-neutral-100 sm:aspect-[2/1]">
        {busy === "locate" && !localCoords ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#faf8f6] px-4 text-center">
            <Loader2 className="size-6 animate-spin text-[#8b2e2e]" />
            <p className="text-sm text-neutral-600">Finding your location…</p>
          </div>
        ) : null}
        <iframe
          key={`${mapCoords.lat.toFixed(5)},${mapCoords.lng.toFixed(5)}`}
          title={localLabel || "Address location map"}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <div className="flex items-start justify-between gap-2 border-t border-neutral-100 px-3 py-2">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#8b2e2e]" />
          <p className="text-xs text-neutral-500">
            {status ||
              localLabel ||
              "Map shows the selected location. Search or use current location."}
          </p>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-[#8b2e2e] hover:underline"
        >
          Open in Maps
        </a>
      </div>
    </div>
  );
}

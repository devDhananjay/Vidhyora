"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  lookupAddressByPincode,
  resolvePlaceDetails,
  suggestAddresses,
} from "@/actions/maps/google-places";
import type { GeocodePlace, PlaceSuggestion } from "@/lib/google/maps";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";

function newSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export type IndiaAddressFields = {
  line1?: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  lat?: number | null;
  lng?: number | null;
  formattedAddress?: string;
};

type AddressAutocompleteProps = {
  /** Controlled search / line1 value */
  value: string;
  onChange: (value: string) => void;
  onResolved: (place: IndiaAddressFields) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  /** Also autofill when a valid 6-digit PIN is typed into this field */
  enablePinShortcut?: boolean;
};

/**
 * India-focused Places Autocomplete (server-proxied) with session tokens.
 * Falls back gracefully when Maps API is not configured.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onResolved,
  label = "Search address",
  placeholder = "Building, street, landmark or area",
  disabled,
  className,
  inputClassName,
  id: idProp,
  enablePinShortcut = false,
}: AddressAutocompleteProps) {
  const reactId = useId();
  const inputId = idProp || `addr-ac-${reactId}`;
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const sessionToken = useRef(newSessionToken());
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  /** After pick / pin resolve, block suggests until the user types again. */
  const lockSuggestRef = useRef(false);
  const requestIdRef = useRef(0);

  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (lockSuggestRef.current) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const q = value.trim();

    if (enablePinShortcut && /^\d{6}$/.test(q.replace(/\D/g, ""))) {
      const pin = q.replace(/\D/g, "");
      debounceRef.current = window.setTimeout(() => {
        const req = ++requestIdRef.current;
        startTransition(async () => {
          const result = await lookupAddressByPincode(pin);
          if (req !== requestIdRef.current) return;
          if (!result.success) {
            setStatus(result.error);
            return;
          }
          lockSuggestRef.current = true;
          setStatus(null);
          setSuggestions([]);
          setOpen(false);
          onResolvedRef.current({
            city: result.data.city,
            state: result.data.state,
            postalCode: result.data.postalCode || pin,
            lat: result.data.lat,
            lng: result.data.lng,
            formattedAddress: result.data.formattedAddress,
            line1: result.data.line1,
          });
        });
      }, 250);
      return () => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
      };
    }

    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      const req = ++requestIdRef.current;
      startTransition(async () => {
        const result = await suggestAddresses(q, sessionToken.current);
        if (req !== requestIdRef.current) return;
        if (!result.success) {
          setStatus(result.error);
          setSuggestions([]);
          setOpen(false);
          return;
        }
        setStatus(null);
        setSuggestions(result.data);
        setOpen(result.data.length > 0);
      });
    }, 280);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, enablePinShortcut]);

  function handleTypedChange(next: string) {
    lockSuggestRef.current = false;
    onChange(next);
  }

  async function pick(suggestion: PlaceSuggestion) {
    // Cancel in-flight / debounced suggests and keep list closed after fill.
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    requestIdRef.current += 1;
    lockSuggestRef.current = true;
    setOpen(false);
    setSuggestions([]);
    setStatus(null);

    startTransition(async () => {
      const result = await resolvePlaceDetails(
        suggestion.placeId,
        sessionToken.current,
      );
      // End autocomplete session after details (Google billing)
      sessionToken.current = newSessionToken();
      if (!result.success) {
        lockSuggestRef.current = false;
        setStatus(result.error);
        onChange(suggestion.description);
        return;
      }
      const place = result.data;
      const pin = (place.postalCode || "").replace(/\D/g, "").slice(0, 6);
      lockSuggestRef.current = true;
      onChange(place.line1 || suggestion.mainText || place.formattedAddress);
      onResolved({
        line1: place.line1 || suggestion.mainText,
        city: place.city,
        state: place.state,
        postalCode: pin,
        lat: place.lat,
        lng: place.lng,
        formattedAddress: place.formattedAddress,
      });
      setOpen(false);
      setSuggestions([]);
    });
  }

  return (
    <div ref={wrapRef} className={cn("relative space-y-1.5", className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand/70" />
        <Input
          id={inputId}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={cn("pl-9 pr-9", inputClassName)}
          onChange={(e) => handleTypedChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length && !lockSuggestRef.current) {
              setOpen(true);
            }
          }}
        />
        {pending ? (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-neutral-400" />
        ) : null}
      </div>
      {status ? (
        <p className="text-[11px] text-amber-700">{status}</p>
      ) : (
        <p className="text-[11px] text-neutral-400">
          Powered by Google · type area / landmark, or a 6-digit PIN
        </p>
      )}
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-brand/15 bg-white py-1 shadow-lg">
          {suggestions.map((item) => (
            <li key={item.placeId}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-brand/5"
                onMouseDown={(e) => {
                  // Prevent input blur-related flicker before click fires.
                  e.preventDefault();
                }}
                onClick={() => void pick(item)}
              >
                <span className="text-sm font-medium text-neutral-900">
                  {item.mainText}
                </span>
                {item.secondaryText ? (
                  <span className="text-xs text-neutral-500">
                    {item.secondaryText}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Apply a GeocodePlace into a partial address patch helper. */
export function placeToAddressPatch(place: GeocodePlace): IndiaAddressFields {
  return {
    line1: place.line1,
    city: place.city,
    state: place.state,
    postalCode: place.postalCode,
    lat: place.lat,
    lng: place.lng,
    formattedAddress: place.formattedAddress,
  };
}

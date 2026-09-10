"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Address } from "@prisma/client";
import {
  lookupAddressByCity,
  lookupAddressByPincode,
} from "@/actions/maps/google-places";
import { createAddress } from "@/actions/address/create-address";
import { updateAddress } from "@/actions/address/update-address";
import {
  AddressMapPreview,
  type MapCoords,
} from "@/components/address/address-map-preview";
import type { GeocodePlace } from "@/lib/google/maps";
import {
  addressFormSchema,
  type AddressFormInput,
} from "@/lib/validations/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountAddressFormProps = {
  address?: Address | null;
  onSuccess?: () => void;
};

type FieldErrors = Partial<Record<keyof AddressFormInput, string>>;

function emptyValues(): AddressFormInput {
  return {
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "IN",
    postalCode: "",
    landmark: "",
    type: "SHIPPING",
    isDefault: false,
  };
}

function toFormValues(address?: Address | null): AddressFormInput {
  if (!address) return emptyValues();
  return {
    name: address.name ?? "",
    phone: (address.phone ?? "").replace(/\D/g, "").slice(-10),
    addressLine1: address.addressLine1 ?? "",
    addressLine2: address.addressLine2 ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    country: address.country || "IN",
    postalCode: address.postalCode ?? "",
    landmark: address.landmark ?? "",
    type: address.type ?? "SHIPPING",
    isDefault: address.isDefault ?? false,
  };
}

function coordsFromPlace(place: {
  lat: number | null;
  lng: number | null;
  formattedAddress?: string;
}): { coords: MapCoords | null; label: string | null } {
  if (
    typeof place.lat === "number" &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  ) {
    return {
      coords: { lat: place.lat, lng: place.lng },
      label: place.formattedAddress || null,
    };
  }
  return { coords: null, label: null };
}

export function AccountAddressForm({
  address,
  onSuccess,
}: AccountAddressFormProps) {
  const [isPending, startTransition] = useTransition();
  const [lookingUp, setLookingUp] = useState<"pin" | "city" | null>(null);
  const [values, setValues] = useState<AddressFormInput>(() =>
    toFormValues(address),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [lookupHint, setLookupHint] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<MapCoords | null>(null);
  const [mapLabel, setMapLabel] = useState<string | null>(null);
  const cityLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialMapLoaded = useRef<string | null>(null);
  const isEdit = Boolean(address);

  useEffect(() => {
    setValues(toFormValues(address));
    setFieldErrors({});
    setFormError(null);
    setLookupHint(null);
    setMapCoords(null);
    setMapLabel(null);
    initialMapLoaded.current = null;
  }, [address]);

  useEffect(() => {
    return () => {
      if (cityLookupTimer.current) clearTimeout(cityLookupTimer.current);
    };
  }, []);

  // Edit mode: centre map on existing PIN
  useEffect(() => {
    if (!address?.id) return;
    const pin = (address.postalCode || "").replace(/\D/g, "");
    if (pin.length !== 6) return;
    if (initialMapLoaded.current === address.id) return;
    initialMapLoaded.current = address.id;

    let cancelled = false;
    void (async () => {
      const result = await lookupAddressByPincode(pin);
      if (cancelled || !result.success) return;
      applyPlaceToForm(result.data, { skipOverwriteAddressLines: true });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address?.id]);

  function setField<K extends keyof AddressFormInput>(
    key: K,
    value: AddressFormInput[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateField(key: keyof AddressFormInput, nextValues = values) {
    const parsed = addressFormSchema.safeParse(nextValues);
    if (parsed.success) {
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const issue = parsed.error.issues.find((item) => item.path[0] === key);
    setFieldErrors((prev) => {
      if (!issue) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: issue.message };
    });
  }

  function applyPlaceToForm(
    place: GeocodePlace,
    options?: { skipOverwriteAddressLines?: boolean },
  ) {
    const { coords, label } = coordsFromPlace(place);
    if (coords) {
      setMapCoords(coords);
      setMapLabel(label);
    } else if (label) {
      setMapLabel(label);
    }

    setValues((prev) => ({
      ...prev,
      postalCode: place.postalCode || prev.postalCode,
      city: place.city || prev.city,
      state: place.state || prev.state,
      country: "IN",
      addressLine1:
        options?.skipOverwriteAddressLines || prev.addressLine1.trim()
          ? prev.addressLine1
          : place.formattedAddress?.split(",")[0]?.trim() || prev.addressLine1,
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.postalCode;
      delete next.city;
      delete next.state;
      return next;
    });
  }

  async function fillFromPincode(pin: string) {
    setLookingUp("pin");
    setLookupHint(null);
    const result = await lookupAddressByPincode(pin);
    setLookingUp(null);
    if (!result.success) {
      setLookupHint(result.error);
      return;
    }
    applyPlaceToForm(result.data, { skipOverwriteAddressLines: true });
    setLookupHint(
      result.data.city
        ? `Auto-filled: ${result.data.city}${result.data.state ? `, ${result.data.state}` : ""}, India`
        : "PIN found",
    );
  }

  async function fillFromCity(city: string) {
    setLookingUp("city");
    setLookupHint(null);
    const result = await lookupAddressByCity(city);
    setLookingUp(null);
    if (!result.success) {
      setLookupHint(result.error);
      return;
    }
    applyPlaceToForm(result.data, { skipOverwriteAddressLines: true });
    setLookupHint(
      [
        result.data.city ? `City: ${result.data.city}` : null,
        result.data.postalCode ? `PIN: ${result.data.postalCode}` : null,
        result.data.state ? `State: ${result.data.state}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Location found",
    );
  }

  function onMapPlaceSelect(place: GeocodePlace) {
    applyPlaceToForm(place, { skipOverwriteAddressLines: true });
    setLookupHint(
      [
        place.city ? `City: ${place.city}` : null,
        place.postalCode ? `PIN: ${place.postalCode}` : null,
        place.state ? `State: ${place.state}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Location selected from map",
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setLookupHint(null);

    const parsed = addressFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key as keyof AddressFormInput]) {
          nextErrors[key as keyof AddressFormInput] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setFormError(parsed.error.issues[0]?.message || "Please fix the form");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(parsed.data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const result = address
        ? await updateAddress(address.id, formData)
        : await createAddress(formData);

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      setValues(emptyValues());
      setFieldErrors({});
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {lookupHint ? (
        <p className="text-sm text-[#8b2e2e]">{lookupHint}</p>
      ) : null}

      <div className="space-y-2">
        <Label>Location on map</Label>
        <AddressMapPreview
          coords={mapCoords}
          autoLocate={!address}
          label={
            mapLabel ||
            (mapCoords
              ? [values.city, values.state, values.postalCode]
                  .filter(Boolean)
                  .join(", ")
              : undefined)
          }
          onPlaceSelect={onMapPlaceSelect}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="addr-pin"
          label="PIN code"
          required
          error={fieldErrors.postalCode}
          hint={
            lookingUp === "pin"
              ? "Looking up city…"
              : "6 digits — city, state & country auto-fill"
          }
        >
          <Input
            id="addr-pin"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="110001"
            maxLength={6}
            value={values.postalCode}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 6);
              setField("postalCode", next);
              if (next.length === 6) {
                void fillFromPincode(next);
              }
            }}
            onBlur={() => {
              validateField("postalCode");
              if (values.postalCode.length === 6) {
                void fillFromPincode(values.postalCode);
              }
            }}
            aria-invalid={Boolean(fieldErrors.postalCode)}
          />
        </Field>

        <Field
          id="addr-city"
          label="City"
          required
          error={fieldErrors.city}
          hint={
            lookingUp === "city"
              ? "Looking up PIN…"
              : "Auto-fills from PIN / map"
          }
        >
          <Input
            id="addr-city"
            autoComplete="address-level2"
            placeholder="City"
            value={values.city}
            onChange={(e) => {
              const next = e.target.value;
              setField("city", next);
              if (cityLookupTimer.current) clearTimeout(cityLookupTimer.current);
              if (next.trim().length >= 3) {
                cityLookupTimer.current = setTimeout(() => {
                  void fillFromCity(next.trim());
                }, 700);
              }
            }}
            onBlur={() => {
              validateField("city");
              if (values.city.trim().length >= 2) {
                void fillFromCity(values.city.trim());
              }
            }}
            aria-invalid={Boolean(fieldErrors.city)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="addr-state"
          label="State"
          required
          error={fieldErrors.state}
        >
          <Input
            id="addr-state"
            autoComplete="address-level1"
            placeholder="State"
            value={values.state}
            onChange={(e) => setField("state", e.target.value)}
            onBlur={() => validateField("state")}
            aria-invalid={Boolean(fieldErrors.state)}
          />
        </Field>

        <Field id="addr-country" label="Country" required>
          <Input id="addr-country" value="India" readOnly disabled />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="addr-name"
          label="Full name"
          required
          error={fieldErrors.name}
        >
          <Input
            id="addr-name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => validateField("name")}
            placeholder="As on delivery"
            aria-invalid={Boolean(fieldErrors.name)}
          />
        </Field>

        <Field
          id="addr-phone"
          label="Mobile number"
          required
          error={fieldErrors.phone}
          hint="Exactly 10 digits"
        >
          <Input
            id="addr-phone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="98XXXXXXXX"
            maxLength={10}
            value={values.phone}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 10);
              setField("phone", next);
            }}
            onBlur={() => validateField("phone")}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
        </Field>
      </div>

      <Field
        id="addr-line1"
        label="Address line 1"
        required
        error={fieldErrors.addressLine1}
        hint="House / flat no., building name"
      >
        <Input
          id="addr-line1"
          value={values.addressLine1}
          onChange={(e) => setField("addressLine1", e.target.value)}
          onBlur={() => validateField("addressLine1")}
          placeholder="House No., Building Name"
          aria-invalid={Boolean(fieldErrors.addressLine1)}
        />
      </Field>

      <Field
        id="addr-line2"
        label="Address line 2"
        error={fieldErrors.addressLine2}
        hint="Road, area, colony (optional)"
      >
        <Input
          id="addr-line2"
          value={values.addressLine2}
          onChange={(e) => setField("addressLine2", e.target.value)}
          placeholder="Road, Area, Colony"
        />
      </Field>

      <Field
        id="addr-landmark"
        label="Landmark"
        error={fieldErrors.landmark}
        hint="Optional"
      >
        <Input
          id="addr-landmark"
          value={values.landmark}
          onChange={(e) => setField("landmark", e.target.value)}
          placeholder="Near metro / market"
        />
      </Field>

      <Field id="addr-type" label="Address type" required>
        <select
          id="addr-type"
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-[#8b2e2e]"
          value={values.type}
          onChange={(e) =>
            setField(
              "type",
              e.target.value as AddressFormInput["type"],
            )
          }
        >
          <option value="SHIPPING">Shipping</option>
          <option value="BILLING">Billing</option>
          <option value="BOTH">Shipping & billing</option>
        </select>
      </Field>

      <div className="flex items-start gap-2 rounded-xl bg-[#faf8f6] px-3 py-3">
        <input
          type="checkbox"
          id="addr-default"
          checked={values.isDefault}
          onChange={(e) => setField("isDefault", e.target.checked)}
          className="mt-0.5 size-4 accent-[#8b2e2e]"
        />
        <Label htmlFor="addr-default" className="cursor-pointer font-normal">
          Make this my default address
          <span className="mt-0.5 block text-xs text-neutral-500">
            Used first at checkout
          </span>
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isPending || lookingUp !== null}
        className="w-full rounded-full sm:w-auto sm:px-8"
      >
        {isPending
          ? "Saving…"
          : isEdit
            ? "Update address"
            : "Save address"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

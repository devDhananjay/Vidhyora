"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStore,
  updateStore,
} from "@/actions/admin/manage-stores";
import type { StoreLocationInput } from "@/lib/validations/content";

type StoreFormProps = {
  store?: StoreLocationInput & { id: string };
  onSaved?: () => void;
};

export function StoreForm({ store, onSaved }: StoreFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(store?.address ?? "");
  const [city, setCity] = useState(store?.city ?? "");
  const [state, setState] = useState(store?.state ?? "");
  const [postalCode, setPostalCode] = useState(store?.postalCode ?? "");
  const [mapUrl, setMapUrl] = useState(store?.mapUrl ?? "");

  const handleSubmit = (formData: FormData) => {
    setError(null);
    if (!address.trim()) {
      setError("Address is required");
      return;
    }
    const payload: StoreLocationInput = {
      name: String(formData.get("name") ?? ""),
      city: city.trim(),
      state: state.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      hours: String(formData.get("hours") ?? ""),
      mapUrl: mapUrl.trim(),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(formData.get("sortOrder") || 0),
    };

    startTransition(async () => {
      const result = store
        ? await updateStore(store.id, payload)
        : await createStore(payload);
      if (result.success) {
        onSaved?.();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form action={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Store name</Label>
        <Input id="name" name="name" defaultValue={store?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={store?.phone} required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <AddressAutocomplete
          value={address}
          onChange={setAddress}
          onResolved={(place) => {
            if (place.line1 || place.formattedAddress) {
              setAddress(place.line1 || place.formattedAddress || address);
            }
            if (place.city) setCity(place.city);
            if (place.state) setState(place.state);
            const pin = (place.postalCode || "").replace(/\D/g, "").slice(0, 6);
            if (pin.length === 6) setPostalCode(pin);
            if (place.lat != null && place.lng != null) {
              setMapUrl(
                `https://www.google.com/maps?q=${place.lat},${place.lng}`,
              );
            }
          }}
          label="Address"
          placeholder="Search store address, landmark or area"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input
          id="state"
          name="state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postalCode">Pincode</Label>
        <Input
          id="postalCode"
          name="postalCode"
          value={postalCode}
          onChange={(e) =>
            setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={store?.email ?? ""}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="hours">Hours</Label>
        <Input
          id="hours"
          name="hours"
          defaultValue={store?.hours ?? "Mon–Sat 11:00 AM – 8:00 PM"}
          required
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="mapUrl">Google Maps URL (optional)</Label>
        <Input
          id="mapUrl"
          name="mapUrl"
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort order</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={store?.sortOrder ?? 0}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={store?.isActive ?? true}
        />
        Visible on store locator
      </label>
      {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : store ? "Save store" : "Add store"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const payload: StoreLocationInput = {
      name: String(formData.get("name") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      address: String(formData.get("address") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      hours: String(formData.get("hours") ?? ""),
      mapUrl: String(formData.get("mapUrl") ?? ""),
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
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={store?.city} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input id="state" name="state" defaultValue={store?.state} required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" defaultValue={store?.address} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postalCode">Pincode</Label>
        <Input id="postalCode" name="postalCode" defaultValue={store?.postalCode ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={store?.email ?? ""} />
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
        <Input id="mapUrl" name="mapUrl" defaultValue={store?.mapUrl ?? ""} />
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

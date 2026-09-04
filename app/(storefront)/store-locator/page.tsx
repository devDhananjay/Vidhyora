import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Clock } from "lucide-react";
import { getPublicStores, getStoreCities } from "@/actions/content/get-stores";
import { storeDirectionsUrl } from "@/lib/content/maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Store Locator | VIDYORA",
  description: "Find a VIDYORA jewellery store near you.",
};

export default async function StoreLocatorPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string }>;
}) {
  const params = await searchParams;
  const city = params.city?.trim() || undefined;
  const q = params.q?.trim() || undefined;
  const [stores, cities] = await Promise.all([
    getPublicStores({ city, q }),
    getStoreCities(),
  ]);

  return (
    <div className="bg-[#faf8f6]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">Visit us</p>
        <h1 className="mt-2 font-serif text-4xl text-neutral-900 md:text-5xl">
          Store Locator
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-600">
          Walk into a VIDYORA boutique for gold, diamond and wedding jewellery.
          Hours and addresses below update from live store listings.
        </p>

        <form className="mt-8 flex flex-col gap-3 md:flex-row" action="/store-locator">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search store, area or pincode"
            className="h-11 bg-white md:max-w-sm"
          />
          <select
            name="city"
            defaultValue={city ?? ""}
            className="h-11 rounded-md border border-input bg-white px-3 text-sm md:w-48"
          >
            <option value="">All cities</option>
            {cities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button type="submit" className="h-11">
            Find stores
          </Button>
        </form>

        {cities.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <CityChip href="/store-locator" active={!city} label="All" />
            {cities.map((item) => (
              <CityChip
                key={item}
                href={`/store-locator?city=${encodeURIComponent(item)}`}
                active={city?.toLowerCase() === item.toLowerCase()}
                label={item}
              />
            ))}
          </div>
        ) : null}

        <p className="mt-8 text-sm text-neutral-500">
          {stores.length} {stores.length === 1 ? "store" : "stores"} found
        </p>

        {stores.length === 0 ? (
          <div className="mt-6 rounded-lg border bg-white p-10 text-center text-neutral-500">
            No stores match this search. Try another city or clear the filters.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {stores.map((store) => (
              <article
                key={store.id}
                className="rounded-lg border border-neutral-100 bg-white p-6"
              >
                <h2 className="font-serif text-2xl text-neutral-900">{store.name}</h2>
                <p className="mt-1 text-sm font-medium text-[#8b2e2e]">{store.city}</p>
                <div className="mt-4 space-y-2 text-sm text-neutral-600">
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {store.address}, {store.city}, {store.state}
                    {store.postalCode ? ` ${store.postalCode}` : ""}
                  </p>
                  <p className="flex gap-2">
                    <Phone className="mt-0.5 size-4 shrink-0" />
                    <a href={`tel:${store.phone}`} className="hover:text-[#8b2e2e]">
                      {store.phone}
                    </a>
                  </p>
                  <p className="flex gap-2">
                    <Clock className="mt-0.5 size-4 shrink-0" />
                    {store.hours}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={storeDirectionsUrl(store)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center rounded-full bg-[#8b2e2e] px-4 text-sm text-white hover:bg-[#7a2727]"
                  >
                    Get directions
                  </a>
                  <a
                    href={`tel:${store.phone}`}
                    className="inline-flex h-10 items-center rounded-full border px-4 text-sm hover:border-[#8b2e2e] hover:text-[#8b2e2e]"
                  >
                    Call store
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CityChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm ${
        active
          ? "bg-[#8b2e2e] text-white"
          : "border border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]"
      }`}
    >
      {label}
    </Link>
  );
}

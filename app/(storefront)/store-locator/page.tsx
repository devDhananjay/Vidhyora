import type { Metadata } from "next";
import Link from "next/link";
import { getPublicStores, getStoreCities } from "@/actions/content/get-stores";
import { StoreLocatorResults } from "@/components/storefront/store-locator-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export const metadata: Metadata = {
  title: "Store Locator | VIDYORA",
  description: "Find a VIDYORA jewellery store near you.",
  alternates: { canonical: "/store-locator" },
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
        <h1 className="mt-2 font-serif text-3xl text-neutral-900 sm:text-4xl md:text-5xl">
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
            className="h-11 bg-white md:min-w-0 md:flex-1"
          />
          <div className="w-full md:w-56">
            <NativeSelect
              name="city"
              defaultValue={city ?? ""}
              className="h-11"
              aria-label="Filter by city"
            >
              <option value="">All cities</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit" className="h-11 shrink-0">
            Find stores
          </Button>
        </form>

        {cities.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <CityChip href="/store-locator" active={!city} label="All" />
            {cities.map((item) => (
              <CityChip
                key={item}
                href={`/store-locator?city=${encodeURIComponent(item)}${
                  q ? `&q=${encodeURIComponent(q)}` : ""
                }`}
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
          <div className="mt-6 rounded-xl border bg-white p-10 text-center text-neutral-500">
            No stores match this search. Try another city or clear the filters.
          </div>
        ) : (
          <StoreLocatorResults stores={stores} />
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

import type { Metadata } from "next";
import { getAdminStores } from "@/actions/admin/manage-stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreForm } from "@/components/admin/store-form";
import { StoreRowActions } from "@/components/admin/store-row-actions";

export const metadata: Metadata = {
  title: "Stores | Admin",
};

function formatStoreAddress(store: {
  address: string;
  city: string;
  state: string;
  postalCode: string | null;
}) {
  const address = store.address.trim();
  const city = store.city.trim();
  const state = store.state.trim();
  const lower = address.toLowerCase();
  const parts = [address];
  if (city && !lower.includes(city.toLowerCase())) parts.push(city);
  if (state && !lower.includes(state.toLowerCase())) parts.push(state);
  const line = parts.filter(Boolean).join(", ");
  return store.postalCode ? `${line} ${store.postalCode}` : line;
}

export default async function AdminStoresPage() {
  const stores = await getAdminStores();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Store Locator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Stores listed here appear on the public Store Locator page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a store</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreForm />
        </CardContent>
      </Card>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No stores yet. Add the first boutique above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{store.name}</h3>
                    <Badge variant={store.isActive ? "default" : "secondary"}>
                      {store.isActive ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatStoreAddress(store)}
                  </p>
                  <p className="mt-1 text-sm">{store.phone} · {store.hours}</p>
                </div>
                <StoreRowActions
                  store={{
                    id: store.id,
                    name: store.name,
                    city: store.city,
                    state: store.state,
                    address: store.address,
                    postalCode: store.postalCode ?? "",
                    phone: store.phone,
                    email: store.email ?? "",
                    hours: store.hours,
                    mapUrl: store.mapUrl ?? "",
                    isActive: store.isActive,
                    sortOrder: store.sortOrder,
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

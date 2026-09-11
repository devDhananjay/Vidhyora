"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Searchable = {
  searchText: string;
};

type OrdersSearchProps<T extends Searchable> = {
  items: T[];
  placeholder?: string;
  children: (filtered: T[]) => React.ReactNode;
};

/**
 * Client-only search wrapper. Must be used from a Client Component parent
 * (do not pass function props across the RSC → client boundary).
 */
export function OrdersSearch<T extends Searchable>({
  items,
  placeholder = "Search orders…",
  children,
}: OrdersSearchProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      item.searchText.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No orders match “{query.trim()}”.
        </p>
      ) : (
        children(filtered)
      )}
    </div>
  );
}

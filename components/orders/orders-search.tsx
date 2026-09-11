"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type OrdersSearchProps<T> = {
  items: T[];
  placeholder?: string;
  getSearchText: (item: T) => string;
  children: (filtered: T[]) => React.ReactNode;
};

export function OrdersSearch<T>({
  items,
  placeholder = "Search orders…",
  getSearchText,
  children,
}: OrdersSearchProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
  }, [items, query, getSearchText]);

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
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No orders match “{query.trim()}”.
        </p>
      ) : (
        children(filtered)
      )}
    </div>
  );
}

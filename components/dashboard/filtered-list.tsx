"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ListFilterOption = {
  id: string;
  label: string;
  count?: number;
};

type FilteredListProps<T> = {
  items: T[];
  filters: ListFilterOption[];
  /** Return true if item matches the active filter id (skip for "all"). */
  matchFilter: (item: T, filterId: string) => boolean;
  /** Text blob for search. */
  searchText: (item: T) => string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  children: (filtered: T[]) => React.ReactNode;
  defaultFilter?: string;
  className?: string;
};

/**
 * Shared search + status chips for dashboard list screens.
 */
export function FilteredList<T>({
  items,
  filters,
  matchFilter,
  searchText,
  searchPlaceholder = "Search…",
  emptyLabel = "No results match your filters.",
  children,
  defaultFilter = "all",
  className,
}: FilteredListProps<T>) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(defaultFilter);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const f of filters) {
      if (f.id === "all") continue;
      map[f.id] = items.filter((item) => matchFilter(item, f.id)).length;
    }
    return map;
  }, [items, filters, matchFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (active !== "all" && !matchFilter(item, active)) return false;
      if (!q) return true;
      return searchText(item).toLowerCase().includes(q);
    });
  }, [items, active, query, matchFilter, searchText]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const isActive = active === filter.id;
            const count =
              filter.count ??
              (filter.id === "all" ? counts.all : counts[filter.id]) ??
              0;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActive(filter.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
                  isActive
                    ? "border-[#8b2e2e] bg-[#8b2e2e] text-white shadow-sm"
                    : "border-[#ead9c4] bg-white text-neutral-700 hover:border-[#d4b896] hover:bg-[#faf6f0]",
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-serif text-xs tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#f6ead7] text-[#8b2e2e]",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="rounded-full border-[#ead9c4] bg-white pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ead9c4] bg-[#faf7f5]/50 px-4 py-12 text-center text-sm text-muted-foreground">
          {query.trim()
            ? `Nothing matched “${query.trim()}”.`
            : emptyLabel}
        </div>
      ) : (
        children(filtered)
      )}
    </div>
  );
}

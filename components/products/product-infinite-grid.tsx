"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { loadMoreStorefrontProducts } from "@/actions/storefront/list-products";
import type { CartPlpLine } from "@/actions/cart/get-cart";
import type { PlpCardProduct } from "@/lib/products/list-products-page";
import type { ProductListParams } from "@/lib/products/product-query";
import { cn } from "@/lib/utils";

type ProductInfiniteGridProps = {
  initialItems: PlpCardProduct[];
  total: number;
  pageSize: number;
  listParams: ProductListParams;
  wishlistIds: string[];
  cartLines: CartPlpLine[];
};

export function ProductInfiniteGrid({
  initialItems,
  total,
  pageSize,
  listParams,
  wishlistIds,
  cartLines,
}: ProductInfiniteGridProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialItems.length < total);
  const [error, setError] = useState<string | null>(null);
  const [listInView, setListInView] = useState(true);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const savedIds = useRef(new Set(wishlistIds));

  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(initialItems.length < total);
    setError(null);
    setListInView(true);
    savedIds.current = new Set(wishlistIds);
  }, [initialItems, total, wishlistIds]);

  // Show "Showing X/Y" only while the product list is on screen (hide on footer).
  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setListInView(entry.isIntersecting),
      { rootMargin: "-80px 0px -20% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length]);

  const loadNext = useCallback(() => {
    if (loadingRef.current || pending || !hasMore) return;
    loadingRef.current = true;
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreStorefrontProducts({
          params: listParams,
          page: nextPage,
          pageSize,
        });
        if (!result.success) {
          setError(result.error || "Could not load more products");
          return;
        }
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const appended = result.data.items.filter((p) => !seen.has(p.id));
          return [...prev, ...appended];
        });
        setPage(result.data.page);
        setHasMore(result.data.hasMore);
        setError(null);
      } finally {
        loadingRef.current = false;
      }
    });
  }, [hasMore, listParams, page, pageSize, pending]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNext();
        }
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadNext]);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 p-12">
        <div className="text-center">
          <h3 className="mb-2 font-serif text-2xl text-brand">
            No jewellery found
          </h3>
          <p className="text-sm text-neutral-500">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  const showing = Math.min(items.length, total);

  return (
    <div ref={listRef} className="relative space-y-10 pb-16">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            isInWishlist={savedIds.current.has(product.id)}
            cartLines={cartLines}
            product={product}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="h-8 w-full" aria-hidden />

      {pending ? (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-neutral-500">
          <Loader2 className="size-4 animate-spin text-[#8b2e2e]" />
          Loading more…
        </div>
      ) : null}

      {error ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadNext}
            className="rounded-full border border-neutral-200 px-4 py-1.5 text-sm text-neutral-700 hover:border-[#8b2e2e]/40"
          >
            Try again
          </button>
        </div>
      ) : null}

      {total > 0 && listInView ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4",
            "pb-[env(safe-area-inset-bottom)]",
          )}
        >
          <div className="pointer-events-auto rounded-full border border-[#ead9c4] bg-[#2b1a16]/92 px-4 py-2 text-[12px] font-medium tracking-wide text-[#f7e7d8] shadow-[0_10px_30px_rgba(43,26,22,0.28)] backdrop-blur-sm">
            Showing{" "}
            <span className="tabular-nums text-white">
              {showing.toLocaleString("en-IN")}
            </span>
            <span className="mx-1 text-[#d4b896]">/</span>
            <span className="tabular-nums text-white">
              {total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

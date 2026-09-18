"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Heart, X } from "lucide-react";
import { getWishlist } from "@/actions/wishlist/manage-wishlist";
import {
  closeWishlistDrawer,
  openWishlistDrawer,
} from "@/lib/wishlist/open-wishlist-drawer";
import { signalNavStart } from "@/lib/nav/signal-nav-start";
import { useCoarsePointer } from "@/lib/hooks/use-coarse-pointer";
import { formatCurrency } from "@/lib/utils";

export { openWishlistDrawer, closeWishlistDrawer };

const OPEN_EVENT = "vidyora-open-wishlist-drawer";
const CLOSE_SOON_EVENT = "vidyora-close-wishlist-drawer-soon";
const CLOSE_EVENT = "vidyora-close-wishlist-drawer";

type OpenDetail = {
  autoCloseMs?: number;
  pinned?: boolean;
  fromHover?: boolean;
};

type MiniWishlistItem = {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnail: string | null;
    basePrice: unknown;
    variants: Array<{ price: unknown; stock: number }>;
  };
};

function linePrice(item: MiniWishlistItem) {
  const variant = item.product.variants[0];
  return variant ? Number(variant.price) : Number(item.product.basePrice);
}

function MiniWishlistLine({ item }: { item: MiniWishlistItem }) {
  const price = linePrice(item);
  const inStock = (item.product.variants[0]?.stock ?? 0) > 0;

  return (
    <div className="flex gap-3 border-b border-border py-3.5 last:border-b-0">
      <Link
        href={`/products/${item.product.slug}`}
        className="relative size-16 shrink-0 overflow-hidden rounded bg-[#f5f1ed]"
      >
        {item.product.thumbnail ? (
          <Image
            src={item.product.thumbnail}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-serif text-neutral-400">
            V
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${item.product.slug}`}
          className="line-clamp-2 text-[13px] leading-snug text-neutral-800 hover:text-[#8b2e2e]"
        >
          {item.product.name}
        </Link>
        {inStock ? (
          <p className="mt-1 text-[13px] font-semibold text-neutral-900">
            {formatCurrency(price)}
          </p>
        ) : (
          <p className="mt-1 text-[12px] font-semibold tracking-wide text-red-600 uppercase">
            Out of stock
          </p>
        )}
      </div>
    </div>
  );
}

export function WishlistDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<MiniWishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const autoCloseMs = useRef(4500);
  const hovering = useRef(false);
  const pinned = useRef(false);

  const clearTimer = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimer();
    pinned.current = false;
    hovering.current = false;
    setOpen(false);
  }, [clearTimer]);

  const scheduleClose = useCallback(
    (ms: number) => {
      clearTimer();
      if (ms <= 0) return;
      closeTimer.current = window.setTimeout(() => {
        if (!hovering.current && !pinned.current) setOpen(false);
      }, ms);
    },
    [clearTimer],
  );

  const loadWishlist = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await getWishlist();
      setItems(data.items as MiniWishlistItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void loadWishlist({ silent: true });
  }, [loadWishlist]);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<OpenDetail>).detail;
      const ms = detail?.autoCloseMs ?? 4500;
      autoCloseMs.current = ms;
      pinned.current = detail?.pinned === true;
      hovering.current = detail?.fromHover === true;
      setOpen(true);
      void loadWishlist({ silent: true });
      if (pinned.current || detail?.fromHover) clearTimer();
      else scheduleClose(ms);
    }

    function onCloseSoon() {
      hovering.current = false;
      if (!pinned.current) scheduleClose(40);
    }

    function onCloseNow() {
      close();
    }

    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener(CLOSE_SOON_EVENT, onCloseSoon);
    window.addEventListener(CLOSE_EVENT, onCloseNow);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener(CLOSE_SOON_EVENT, onCloseSoon);
      window.removeEventListener(CLOSE_EVENT, onCloseNow);
      clearTimer();
    };
  }, [scheduleClose, clearTimer, close, loadWishlist]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const count = items.length;

  const portal =
    mounted && open
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[9999]"
            aria-live="polite"
          >
            <button
              type="button"
              aria-label="Dismiss mini wishlist"
              className="pointer-events-auto absolute inset-0 cursor-default bg-black/20 md:inset-x-0 md:bottom-0 md:top-[5.75rem] md:bg-transparent lg:top-[6.75rem]"
              onClick={close}
            />
            <aside
              role="dialog"
              aria-modal="false"
              aria-label="Mini wishlist"
              onMouseEnter={() => {
                hovering.current = true;
                clearTimer();
              }}
              onMouseLeave={() => {
                hovering.current = false;
                if (!pinned.current) scheduleClose(40);
                else if (autoCloseMs.current > 0) {
                  scheduleClose(Math.min(autoCloseMs.current, 2500));
                }
              }}
              className="pointer-events-auto absolute inset-x-0 bottom-0 flex max-h-[min(78vh,560px)] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-popover text-popover-foreground shadow-[0_-12px_40px_rgba(43,26,22,0.18)] md:inset-x-auto md:top-[5.75rem] md:right-14 md:bottom-auto md:max-h-[min(70vh,520px)] md:w-[min(100vw-1.5rem,340px)] md:rounded-xl md:shadow-md lg:top-[6.75rem]"
            >
              <div className="flex shrink-0 justify-center pt-2 md:hidden">
                <span className="h-1 w-10 rounded-full bg-neutral-300" />
              </div>
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-serif text-lg text-[#8b2e2e]">
                  Your Wishlist
                  <span className="font-sans text-sm font-normal text-neutral-700">
                    {" "}
                    ({" "}
                    {count} {count === 1 ? "Item" : "Items"} )
                  </span>
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={close}
                  className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                >
                  <X className="size-5" strokeWidth={1.8} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                {loading && items.length === 0 ? (
                  <div className="py-10 text-center text-sm text-neutral-500">
                    Loading…
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Heart
                      className="size-8 text-neutral-300"
                      strokeWidth={1.4}
                    />
                    <p className="text-sm text-neutral-600">
                      Your wishlist is empty
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <MiniWishlistLine key={item.id} item={item} />
                  ))
                )}
              </div>

              {items.length > 0 ? (
                <div className="shrink-0 border-t border-border p-3">
                  <Link
                    href="/wishlist"
                    onClick={close}
                    className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#8b2e2e] text-sm font-medium text-white transition hover:bg-[#7a2727]"
                  >
                    View Wishlist
                  </Link>
                </div>
              ) : null}
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {children}
      {portal}
    </>
  );
}

/** Header heart — hover opens mini wishlist; click opens full wishlist. */
export function WishlistHeartButton({ itemCount }: { itemCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const coarse = useCoarsePointer();

  useEffect(() => {
    router.prefetch("/wishlist");
  }, [router]);

  return (
    <button
      type="button"
      onPointerEnter={() => {
        if (coarse) return;
        openWishlistDrawer({ autoCloseMs: 0, fromHover: true });
      }}
      onPointerLeave={() => {
        if (coarse) return;
        window.dispatchEvent(
          new Event("vidyora-close-wishlist-drawer-soon"),
        );
      }}
      onClick={() => {
        if (coarse) {
          openWishlistDrawer({ autoCloseMs: 0, pinned: true });
          return;
        }
        closeWishlistDrawer();
        if (pathname === "/wishlist") return;
        signalNavStart("/wishlist");
        router.push("/wishlist");
      }}
      className="relative z-[10001] rounded-full p-2.5 text-brand hover:bg-brand/5 md:p-2"
      aria-label={
        itemCount > 0
          ? `Wishlist with ${itemCount} items`
          : "Wishlist"
      }
    >
      <Heart className="size-5" strokeWidth={1.5} />
      {itemCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-red-600 p-0 text-[10px] text-white md:-top-1 md:-right-1 md:text-xs">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      ) : null}
    </button>
  );
}

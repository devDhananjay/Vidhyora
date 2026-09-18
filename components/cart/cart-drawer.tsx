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
import { ShoppingBag, X } from "lucide-react";
import { getCart } from "@/actions/cart/get-cart";
import { openCartDrawer } from "@/lib/cart/open-cart-drawer";
import { signalNavStart } from "@/lib/nav/signal-nav-start";
import { formatCurrency } from "@/lib/utils";
import type { CartItemWithDetails, CartWithItems } from "@/types/cart";

export { openCartDrawer };

const OPEN_EVENT = "vidyora-open-cart-drawer";
const CLOSE_SOON_EVENT = "vidyora-close-cart-drawer-soon";
const CLOSE_EVENT = "vidyora-close-cart-drawer";

type OpenDetail = {
  autoCloseMs?: number;
  pinned?: boolean;
  fromHover?: boolean;
};

function activeItems(cart: CartWithItems | null) {
  if (!cart) return [];
  return cart.items.filter((item) => !item.savedForLater);
}

function cartSubtotal(items: CartItemWithDetails[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0,
  );
}

function lineMeta(item: CartItemWithDetails) {
  const attributes = item.variant.attributes as Record<string, string> | null;
  const parts: string[] = [`Qty ${item.quantity}`];
  if (item.variant.weight != null) {
    parts.push(`${Number(item.variant.weight)} gm`);
  } else if (attributes) {
    const size = Object.entries(attributes).find(([key]) =>
      /size|weight|gm/i.test(key),
    );
    if (size?.[1]) parts.push(String(size[1]));
  }
  return parts.join(" | ");
}

function MiniCartLine({ item }: { item: CartItemWithDetails }) {
  const price = Number(item.variant.price);
  const inStock = item.variant.stock - item.variant.reservedStock > 0;

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
        <p className="mt-1 text-[11px] text-neutral-500">{lineMeta(item)}</p>
        {inStock ? (
          <p className="mt-1 text-[13px] font-semibold text-neutral-900">
            Price {formatCurrency(price)}
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

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<CartWithItems | null>(null);
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

  const loadCart = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      setCart(await getCart());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    // Prefetch so hover mini-cart opens with data already ready
    void loadCart({ silent: true });
  }, [loadCart]);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<OpenDetail>).detail;
      const ms = detail?.autoCloseMs ?? 4500;
      autoCloseMs.current = ms;
      pinned.current = detail?.pinned === true;
      hovering.current = detail?.fromHover === true;
      setOpen(true);
      void loadCart({ silent: true });
      if (pinned.current || detail?.fromHover) {
        clearTimer();
      } else {
        scheduleClose(ms);
      }
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
  }, [scheduleClose, clearTimer, close, loadCart]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const items = activeItems(cart);
  const subtotal = cartSubtotal(items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasStockIssue = items.some((item) => {
    const available = item.variant.stock - item.variant.reservedStock;
    return available < item.quantity;
  });

  const portal =
    mounted && open
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[9999]"
            aria-live="polite"
          >
            {/* click-away below header so bag / profile stay hoverable */}
            <button
              type="button"
              aria-label="Dismiss mini cart"
              className="pointer-events-auto absolute inset-x-0 bottom-0 top-[5.75rem] cursor-default bg-transparent sm:top-[6.75rem]"
              onClick={close}
            />
            <aside
              role="dialog"
              aria-modal="false"
              aria-label="Mini cart"
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
              className="pointer-events-auto absolute top-[5.75rem] right-3 flex max-h-[min(70vh,520px)] w-[min(100vw-1.5rem,340px)] flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-md sm:right-6 sm:top-[6.75rem]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-serif text-lg text-[#8b2e2e]">
                  Your Mini Cart
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
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                >
                  <X className="size-4" strokeWidth={1.8} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                {loading && items.length === 0 ? (
                  <div className="py-10 text-center text-sm text-neutral-500">
                    Loading…
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <ShoppingBag
                      className="size-8 text-neutral-300"
                      strokeWidth={1.4}
                    />
                    <p className="text-sm text-neutral-600">Your bag is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <MiniCartLine key={item.id} item={item} />
                  ))
                )}
              </div>

              {items.length > 0 ? (
                <div className="shrink-0">
                  <div className="flex items-center justify-between bg-[#f6ead7] px-4 py-2.5 text-sm">
                    <span className="font-medium text-neutral-800">
                      Sub Total
                    </span>
                    <span className="font-semibold text-[#8b2e2e]">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {hasStockIssue ? (
                    <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-700">
                      Remove out-of-stock items before checkout.
                    </p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2.5 p-3">
                    <Link
                      href="/cart"
                      onClick={close}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#8b2e2e]/50 bg-white text-sm font-medium text-[#8b2e2e] transition hover:bg-[#8b2e2e]/5"
                    >
                      View Cart
                    </Link>
                    {hasStockIssue ? (
                      <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-500">
                        Quick Checkout
                      </span>
                    ) : (
                      <Link
                        href="/checkout"
                        onClick={close}
                        className="inline-flex h-10 items-center justify-center rounded-full bg-[#8b2e2e] text-sm font-medium text-white transition hover:bg-[#7a2727]"
                      >
                        Quick Checkout
                      </Link>
                    )}
                  </div>
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

/** Header bag — hover opens mini cart; click opens full cart page. */
export function CartBagButton({ itemCount }: { itemCount: number }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.prefetch("/cart");
  }, [router]);

  return (
    <button
      type="button"
      onPointerEnter={() => {
        openCartDrawer({ autoCloseMs: 0, fromHover: true });
      }}
      onPointerLeave={() => {
        window.dispatchEvent(new Event("vidyora-close-cart-drawer-soon"));
      }}
      onClick={() => {
        window.dispatchEvent(new Event("vidyora-close-cart-drawer"));
        // Already on cart — don't push / show loader (would spin forever)
        if (pathname === "/cart") return;
        signalNavStart("/cart");
        router.push("/cart");
      }}
      className="relative z-[10001] rounded-full p-2 hover:bg-accent"
      aria-label={
        itemCount > 0
          ? `Shopping cart with ${itemCount} items`
          : "Shopping cart"
      }
    >
      <ShoppingBag className="size-5 text-[#8b2e2e]" strokeWidth={1.5} />
      {itemCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-600 p-0 text-xs text-white">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      ) : null}
    </button>
  );
}

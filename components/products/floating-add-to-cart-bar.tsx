"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Scale, ShoppingBag } from "lucide-react";
import { addToCart } from "@/actions/cart/add-to-cart";
import { cn, formatCurrency } from "@/lib/utils";

type FloatingAddToCartBarProps = {
  productId: string;
  variantId?: string;
  price: number;
  weightLabel?: string | null;
  inStock: boolean;
  /** Element id of the main Add to Cart row — bar shows when this leaves view */
  sentinelId?: string;
};

export function FloatingAddToCartBar({
  productId,
  variantId,
  price,
  weightLabel,
  inStock,
  sentinelId = "product-main-actions",
}: FloatingAddToCartBarProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const lastY = useRef(0);
  const pastActions = useRef(false);

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        pastActions.current = !entry.isIntersecting;
        // Show once main ATC is off-screen (user scrolled into product content)
        setShow(!entry.isIntersecting && window.scrollY > 120);
      },
      { threshold: 0.15, rootMargin: "-64px 0px 0px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  useEffect(() => {
    lastY.current = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      const goingUp = y < lastY.current;
      lastY.current = y;

      // Keep visible while past ATC; if scrolling up near top, hide when ATC returns
      if (!pastActions.current) {
        setShow(false);
        return;
      }

      // Prefer showing when scrolling up through the page (Tanishq-like sticky buy bar)
      if (goingUp || y > 180) {
        setShow(true);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleAdd() {
    if (!variantId) {
      alert("Please select a variant");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("variantId", variantId);
      formData.append("quantity", "1");

      const result = await addToCart(formData);
      if (result.success) {
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2000);
        router.refresh();
      } else {
        alert(result.error || "Failed to add to cart");
      }
    });
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-3 transition-all duration-300 md:bottom-6",
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0",
      )}
      aria-hidden={!show}
    >
      <div
        className={cn(
          "pointer-events-auto relative flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-[#ead9c4]/90 bg-white/95 p-1.5 shadow-[0_16px_48px_rgba(43,26,22,0.2)] backdrop-blur-md md:gap-3 md:p-2",
          !show && "pointer-events-none",
        )}
      >
        <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c5a46e]/80 to-transparent" />
        <div className="flex items-center border-r border-neutral-200 px-3 md:px-4">
          <span className="font-serif text-base text-neutral-900 md:text-xl">
            {formatCurrency(price)}
          </span>
        </div>

        {weightLabel ? (
          <div className="hidden items-center gap-1.5 rounded-full bg-[#f5f1ed] px-3 py-2 text-xs text-neutral-700 md:flex">
            <Scale className="size-3.5 text-[#8b2e2e]" strokeWidth={1.7} />
            <span className="whitespace-nowrap">Weight: {weightLabel}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock || pending || !show}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#8b2e2e] px-5 text-sm font-medium text-white transition hover:bg-[#7a2727] disabled:opacity-60 md:h-12 md:min-w-[160px] md:px-7"
        >
          {added ? (
            <>
              <Check className="size-4" strokeWidth={2} />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" strokeWidth={1.8} />
              {pending
                ? "Adding..."
                : inStock
                  ? "Add to Cart"
                  : "Out of Stock"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

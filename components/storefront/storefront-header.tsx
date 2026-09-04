"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake, Heart, MapPin, Search, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MegaNav } from "@/components/storefront/mega-nav";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/user";
import { UserMenu } from "@/components/auth/user-menu";

type StorefrontHeaderProps = {
  user: SessionUser | null;
  cartSlot: React.ReactNode;
};

export function StorefrontHeader({ user, cartSlot }: StorefrontHeaderProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setCompact(window.scrollY > 56);
        ticking = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 overflow-visible border-b border-neutral-100 bg-white/95 backdrop-blur-sm transition-[box-shadow] duration-300",
        compact && "shadow-[0_4px_18px_rgba(43,26,22,0.08)]",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-1 md:py-1.5">
        <Link href={ROUTES.home} className="shrink-0" aria-label="VIDYORA home">
          <BrandLogo
            size="md"
            priority
            className={cn(
              "transition-all duration-300 ease-out",
              compact
                ? "!h-12 !w-12 md:!h-14 md:!w-14"
                : "!h-[72px] !w-[72px] md:!h-20 md:!w-20",
            )}
          />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <form action={ROUTES.products} className="relative w-full max-w-xl">
            <input
              type="search"
              name="q"
              placeholder="Search for gold necklace, diamond jewellery"
              className={cn(
                "w-full rounded-full border border-neutral-200 bg-white px-5 pr-11 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 transition-[height] duration-300 focus:border-neutral-400",
                compact ? "h-9" : "h-10",
              )}
              aria-label="Search jewellery"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
              aria-label="Search"
            >
              <Search className="size-4" />
            </button>
          </form>
        </div>

        <nav className="ml-auto flex items-center gap-1 text-[#8b2e2e]">
          <Link
            href={ROUTES.partner}
            className={cn(
              "relative z-20 mr-1 inline-flex items-center gap-1.5 rounded-full border border-[#8b2e2e]/20 bg-[#8b2e2e]/5 font-medium text-[#8b2e2e] transition hover:bg-[#8b2e2e] hover:text-white",
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]",
            )}
          >
            <Handshake className="size-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Partner with Us</span>
          </Link>
          <Link
            href={ROUTES.storeLocator}
            className="rounded-full p-2 text-[#8b2e2e] hover:bg-[#8b2e2e]/5"
            aria-label="Store locator"
          >
            <MapPin className="size-5" strokeWidth={1.5} />
          </Link>
          {user ? (
            <>
              <Link
                href={ROUTES.wishlist}
                className="rounded-full p-2 text-[#8b2e2e] hover:bg-[#8b2e2e]/5"
                aria-label="Wishlist"
              >
                <Heart className="size-5" strokeWidth={1.5} />
              </Link>
              <UserMenu user={user} />
              {cartSlot}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full p-2 text-[#8b2e2e] hover:bg-[#8b2e2e]/5"
                aria-label="Login"
              >
                <User className="size-5" strokeWidth={1.5} />
              </Link>
              {cartSlot}
            </>
          )}
        </nav>
      </div>

      <div
        className={cn(
          "transition-opacity duration-300 ease-out",
          compact
            ? "pointer-events-none hidden opacity-0"
            : "opacity-100",
        )}
        aria-hidden={compact}
      >
        <MegaNav disabled={compact} />
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Handshake, Heart, MapPin, Search, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MegaNav } from "@/components/storefront/mega-nav";
// Dark / light mode — on hold for now
// import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/user";
import { UserMenu } from "@/components/auth/user-menu";
import type { MegaMenuItem } from "@/lib/nav/mega-menu-data";

type StorefrontHeaderProps = {
  user: SessionUser | null;
  cartSlot: React.ReactNode;
  megaMenu: MegaMenuItem[];
};

/** Hysteresis avoids rapid sticky compact flicker near the threshold. */
const COMPACT_ON_Y = 96;
const COMPACT_OFF_Y = 40;

export function StorefrontHeader({
  user,
  cartSlot,
  megaMenu,
}: StorefrontHeaderProps) {
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);

  useEffect(() => {
    let ticking = false;

    function applyScroll() {
      const y = window.scrollY;
      let next = compactRef.current;
      if (!next && y >= COMPACT_ON_Y) next = true;
      else if (next && y <= COMPACT_OFF_Y) next = false;

      if (next !== compactRef.current) {
        compactRef.current = next;
        setCompact(next);
      }
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyScroll);
    }

    applyScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 overflow-visible border-b border-border bg-background/95 backdrop-blur-sm transition-[box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] print:hidden",
        compact &&
          "shadow-[0_4px_18px_rgba(43,26,22,0.08)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-1 sm:gap-6 sm:px-4 md:py-1.5">
        <Link
          href={ROUTES.home}
          className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-[72px] sm:w-[72px] md:h-20 md:w-20"
          aria-label="VIDYORA home"
        >
          <BrandLogo
            size="md"
            priority
            className={cn(
              "!absolute left-1/2 top-1/2 !h-14 !w-14 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform sm:!h-[72px] sm:!w-[72px] md:!h-20 md:!w-20",
              compact && "scale-[0.72] md:scale-[0.7]",
            )}
          />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <form action={ROUTES.search} className="relative w-full max-w-xl">
            <input
              type="search"
              name="q"
              placeholder="Search for gold necklace, diamond jewellery"
              className={cn(
                "h-10 w-full rounded-full border border-border bg-card px-5 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-[padding,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-brand",
                compact && "shadow-sm",
              )}
              aria-label="Search jewellery"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Search"
            >
              <Search className="size-4" />
            </button>
          </form>
        </div>

        {/* Mobile search */}
        <form action={ROUTES.search} className="relative min-w-0 flex-1 md:hidden">
          <input
            type="search"
            name="q"
            placeholder="Search jewellery"
            className="h-9 w-full rounded-full border border-border bg-card px-3 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
            aria-label="Search jewellery"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-1 text-brand">
          {/* Dark / light mode — on hold for now
          <ThemeToggle />
          */}
          <Link
            href={ROUTES.partner}
            className="relative z-20 mr-1 hidden items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1.5 text-[12px] font-medium text-brand transition duration-500 hover:bg-brand hover:text-primary-foreground sm:inline-flex"
          >
            <Handshake className="size-3.5" strokeWidth={1.75} />
            <span className="hidden md:inline">Partner with Us</span>
          </Link>
          <Link
            href={ROUTES.storeLocator}
            className="rounded-full p-2 text-brand hover:bg-brand/5"
            aria-label="Store locator"
          >
            <MapPin className="size-5" strokeWidth={1.5} />
          </Link>
          {user ? (
            <>
              <Link
                href={ROUTES.wishlist}
                className="rounded-full p-2 text-brand hover:bg-brand/5"
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
                className="rounded-full p-2 text-brand hover:bg-brand/5"
                aria-label="Login"
              >
                <User className="size-5" strokeWidth={1.5} />
              </Link>
              {cartSlot}
            </>
          )}
        </nav>
      </div>

      {/* Desktop mega nav — soft collapse (grid rows) to avoid sticky blink */}
      <div
        className={cn(
          "hidden md:grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          compact
            ? "pointer-events-none grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100",
        )}
        aria-hidden={compact}
      >
        <div className="min-h-0 overflow-hidden">
          <MegaNav items={megaMenu} disabled={compact} desktopOnly />
        </div>
      </div>

      {/* Mobile categories — always visible */}
      <div className="md:hidden">
        <MegaNav items={megaMenu} mobileOnly />
      </div>
    </header>
  );
}

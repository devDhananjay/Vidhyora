"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/shared/brand-loader";

function isSameDocumentUrl(href: string) {
  try {
    const url = new URL(href, window.location.href);
    return (
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  } catch {
    return false;
  }
}

/**
 * Brief brand loader on client navigations — hide quickly once the route changes.
 * Never sticks when navigating to the same URL (e.g. cart click while already on /cart).
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const first = useRef(true);
  const hideTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (safetyTimer.current != null) {
      window.clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  };

  const showLoader = () => {
    setVisible(true);
    if (safetyTimer.current != null) window.clearTimeout(safetyTimer.current);
    // Hard stop — never leave the spinner spinning forever
    safetyTimer.current = window.setTimeout(() => setVisible(false), 2500);
  };

  const hideLoaderSoon = () => {
    if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      if (safetyTimer.current != null) {
        window.clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    }, 120);
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (isSameDocumentUrl(href)) return;

      showLoader();
    };

    const onNavStart = (event: Event) => {
      const href = (event as CustomEvent<{ href?: string }>).detail?.href;
      if (href && isSameDocumentUrl(href)) return;
      showLoader();
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("vidyora-nav-start", onNavStart);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("vidyora-nav-start", onNavStart);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    hideLoaderSoon();
    return () => {
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;
  return <BrandLoader overlay />;
}

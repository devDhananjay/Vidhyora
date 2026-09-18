"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type ProductBackNavProps = {
  /** Encoded listing path from ?from= e.g. /products?category=rings */
  from?: string | null;
  categoryHref: string;
  categoryLabel: string;
};

function labelForPath(path: string) {
  if (path.startsWith("/search")) return "Back to search";
  if (path.startsWith("/collections/")) return "Back to collection";
  if (path.startsWith("/categories/")) return "Back to category";
  if (path.startsWith("/products")) return "Back to jewellery";
  if (path === "/" || path.startsWith("/?")) return "Back to home";
  return "Back to listing";
}

function safeFromPath(raw: string | null | undefined) {
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.startsWith("/products/")) return null;
  return decoded;
}

export function ProductBackNav({
  from,
  categoryHref,
  categoryLabel,
}: ProductBackNavProps) {
  const router = useRouter();
  const listing = safeFromPath(from);
  const href = listing || categoryHref;
  const label = listing
    ? labelForPath(listing)
    : `Back to ${categoryLabel}`;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
          }
          router.push(href);
        }}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition hover:text-[#8b2e2e]"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        {label}
      </button>
      {listing ? (
        <p className="mt-1 text-xs text-neutral-400">
          Or open{" "}
          <Link
            href={href}
            className="underline underline-offset-2 hover:text-neutral-600"
          >
            your previous listing
          </Link>
        </p>
      ) : null}
    </div>
  );
}

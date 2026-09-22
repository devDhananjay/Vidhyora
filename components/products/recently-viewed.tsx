"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

const STORAGE_KEY = "vidyora-recently-viewed";
const MAX_ITEMS = 12;

export type RecentlyViewedItem = {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
  price: number;
};

function readItems(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentlyViewedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(items: RecentlyViewedItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore quota errors
  }
}

type RecentlyViewedTrackerProps = {
  productId: string;
  slug: string;
  name: string;
  thumbnail: string | null;
  price: number;
};

export function RecentlyViewedTracker({
  productId,
  slug,
  name,
  thumbnail,
  price,
}: RecentlyViewedTrackerProps) {
  useEffect(() => {
    const next: RecentlyViewedItem = {
      id: productId,
      slug,
      name,
      thumbnail,
      price,
    };
    const existing = readItems().filter((item) => item.id !== productId);
    writeItems([next, ...existing]);
  }, [productId, slug, name, thumbnail, price]);

  return null;
}

export function RecentlyViewedRail({
  excludeId,
  title = "Recently Viewed",
}: {
  excludeId?: string;
  title?: string;
}) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(
      readItems().filter((item) => (excludeId ? item.id !== excludeId : true)),
    );
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <h2 className="mb-6 font-serif text-2xl text-brand md:text-3xl">
        {title}
      </h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group w-[148px] shrink-0 sm:w-[168px]"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f4efe8]">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="168px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-neutral-400">
                  —
                </div>
              )}
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-neutral-800">
              {item.name}
            </p>
            <p className="mt-1 text-sm font-medium text-brand">
              {formatCurrency(item.price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

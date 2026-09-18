"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductFavoriteButton } from "@/components/products/product-favorite-button";
import {
  ProductCardQuickAdd,
  type CardVariantOption,
} from "@/components/products/product-card-quick-add";
import type { CartPlpLine } from "@/actions/cart/get-cart";
import { isVideoUrl } from "@/lib/media/is-video-url";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    basePrice: number;
    compareAtPrice: number | null;
    thumbnail: string | null;
    images?: string[];
    isBestSeller?: boolean;
    metalLabel?: string | null;
    variants?: CardVariantOption[];
  };
  isInWishlist?: boolean;
  cartLines?: CartPlpLine[];
};

function hasValidImage(src: string | null | undefined) {
  if (!src) return false;
  if (src.includes("placeholder")) return false;
  if (isVideoUrl(src)) return false;
  return true;
}

function galleryFor(product: ProductCardProps["product"]) {
  if (product.images && product.images.length > 0) {
    return product.images.filter((src) => hasValidImage(src));
  }
  return hasValidImage(product.thumbnail) && product.thumbnail
    ? [product.thumbnail]
    : [];
}

export function ProductCard({
  product,
  isInWishlist = false,
  cartLines = [],
}: ProductCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.basePrice) /
          product.compareAtPrice) *
          100,
      )
    : 0;

  const gallery = galleryFor(product);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const listingQuery = searchParams?.toString() || "";
  const fromPath = listingQuery ? `${pathname}?${listingQuery}` : pathname;
  const productHref = `/products/${product.slug}?from=${encodeURIComponent(fromPath)}`;

  useEffect(() => {
    if (!hovering || gallery.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % gallery.length);
    }, 850);
    return () => window.clearInterval(timer);
  }, [hovering, gallery.length]);

  useEffect(() => {
    if (!hovering) setIndex(0);
  }, [hovering]);

  return (
    <div
      className="group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#eef3f2] shadow-none transition duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_rgba(43,26,22,0.16)]">
        <Link href={productHref} className="absolute inset-0">
          {gallery.length > 0 ? (
            <div
              className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {gallery.map((src) => (
                <div key={src} className="relative h-full min-w-full">
                  <Image
                    src={src}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex size-full items-center justify-center font-serif text-neutral-400">
              VIDYORA
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/10" />
        </Link>

        {product.isBestSeller ? (
          <span className="absolute left-0 top-0 z-10 flex items-center gap-1 rounded-br-xl bg-[#c5a46e] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">
            <Star className="size-2.5 fill-white" strokeWidth={0} />
            BESTSELLER
          </span>
        ) : null}

        {gallery.length > 1 && hovering ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1">
            {gallery.map((src, dot) => (
              <span
                key={src}
                className={`h-1 rounded-full transition-all duration-300 ${
                  dot === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        ) : null}

        <ProductFavoriteButton
          productId={product.id}
          isInWishlist={isInWishlist}
        />
      </div>

      <div className="pt-3">
        <Link href={productHref} className="block">
          <h3 className="line-clamp-1 text-sm text-neutral-800 transition-colors duration-300 group-hover:text-[#8b2e2e]">
            {product.name}
          </h3>
          {product.metalLabel ? (
            <p className="mt-1 line-clamp-1 text-[11px] tracking-wide text-neutral-500 uppercase">
              {product.metalLabel}
            </p>
          ) : null}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-neutral-900">
              {formatCurrency(product.basePrice)}
            </span>
            {product.compareAtPrice ? (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
          {discount > 0 ? (
            <p className="mt-2 rounded-md bg-[#f6ead7] px-2 py-1 text-[11px] text-[#8b2e2e]">
              Save {discount}% instantly
            </p>
          ) : null}
        </Link>

        {product.variants && product.variants.length > 0 ? (
          <ProductCardQuickAdd
            productId={product.id}
            variants={product.variants}
            cartLines={cartLines.filter((line) => line.productId === product.id)}
          />
        ) : null}
      </div>
    </div>
  );
}

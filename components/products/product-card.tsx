import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { ProductFavoriteButton } from "@/components/products/product-favorite-button";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    basePrice: number;
    compareAtPrice: number | null;
    thumbnail: string | null;
  };
  isInWishlist?: boolean;
};

function hasValidImage(src: string | null) {
  if (!src) return false;
  if (src.includes("placeholder")) return false;
  return true;
}

export function ProductCard({ product, isInWishlist = false }: ProductCardProps) {
  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.basePrice) /
          product.compareAtPrice) *
          100,
      )
    : 0;

  const showImage = hasValidImage(product.thumbnail);

  return (
    <div className="group">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#eef3f2]">
        <Link href={`/products/${product.slug}`} className="absolute inset-0">
          {showImage && product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-serif text-neutral-400">
              VIDYORA
            </div>
          )}
        </Link>
        <ProductFavoriteButton
          productId={product.id}
          isInWishlist={isInWishlist}
        />
      </div>

      <Link href={`/products/${product.slug}`} className="block pt-3">
        <h3 className="line-clamp-1 text-sm text-neutral-800">{product.name}</h3>
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
            {discount}% off on making charges
          </p>
        ) : null}
      </Link>
    </div>
  );
}

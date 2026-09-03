"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { removeFromWishlist } from "@/actions/wishlist/manage-wishlist";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingCart } from "lucide-react";

type WishlistItemProps = {
  item: {
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      thumbnail: string | null;
      basePrice: any;
      compareAtPrice: any | null;
      status: string;
      approvalStatus: string;
      variants: Array<{
        price: any;
        stock: number;
      }>;
    };
  };
};

export function WishlistItem({ item }: WishlistItemProps) {
  const [isPending, startTransition] = useTransition();
  const product = item.product;

  const price = product.variants.length
    ? Number(product.variants[0].price)
    : Number(product.basePrice);

  const comparePrice = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;

  const discount = comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const inStock =
    product.variants.length > 0 ? product.variants[0].stock > 0 : false;

  const isAvailable =
    product.status === "ACTIVE" && product.approvalStatus === "APPROVED";

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeFromWishlist(product.id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Image */}
          <Link href={`/products/${product.slug}`} className="block">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              {product.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted text-6xl">
                  📦
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute right-2 top-2 bg-destructive">
                  {discount}% OFF
                </Badge>
              )}
            </div>
          </Link>

          {/* Product Info */}
          <div className="space-y-2">
            <Link
              href={`/products/${product.slug}`}
              className="line-clamp-2 font-semibold hover:text-primary"
            >
              {product.name}
            </Link>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">
                {formatCurrency(price)}
              </span>
              {comparePrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(comparePrice)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {isAvailable ? (
              <Badge
                variant="outline"
                className={inStock ? "text-green-600" : "text-red-600"}
              >
                {inStock ? "In Stock" : "Out of Stock"}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600">
                Unavailable
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isAvailable && inStock && (
              <Link href={`/products/${product.slug}`} className="flex-1">
                <Button className="w-full gap-2" size="sm">
                  <ShoppingCart className="size-4" />
                  Add to Cart
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
              className="gap-2"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

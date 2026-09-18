"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingCart, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { removeFromWishlist } from "@/actions/wishlist/manage-wishlist";
import { addToCart } from "@/actions/cart/add-to-cart";
import { formatCurrency } from "@/lib/utils";
import { appAlert } from "@/components/shared/app-dialog";
import { openCartDrawer } from "@/lib/cart/open-cart-drawer";

type WishlistItemProps = {
  item: {
    id: string;
    variantId?: string | null;
    product: {
      id: string;
      name: string;
      slug: string;
      thumbnail: string | null;
      basePrice: unknown;
      compareAtPrice: unknown | null;
      status: string;
      approvalStatus: string;
      variants: Array<{
        id: string;
        price: unknown;
        stock: number;
      }>;
    };
  };
  readOnly?: boolean;
};

export function WishlistItem({ item, readOnly = false }: WishlistItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const product = item.product;

  const variant =
    product.variants.find((v) => v.id === item.variantId) ||
    product.variants[0];

  const price = variant
    ? Number(variant.price)
    : Number(product.basePrice);

  const comparePrice = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;

  const discount = comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const inStock = variant ? variant.stock > 0 : false;

  const isAvailable =
    product.status === "ACTIVE" && product.approvalStatus === "APPROVED";

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeFromWishlist(product.id);
      if (result.success) {
        router.refresh();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const handleAddToCart = () => {
    if (!variant?.id) {
      void appAlert("Please open the product to choose a size", {
        variant: "error",
      });
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", product.id);
      formData.append("variantId", variant.id);
      formData.append("quantity", "1");
      const result = await addToCart(formData);
      if (!result.success) {
        await appAlert(result.error, { variant: "error" });
        return;
      }
      openCartDrawer();
      window.setTimeout(() => router.refresh(), 150);
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
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
                <div className="flex size-full items-center justify-center bg-muted font-serif text-neutral-400">
                  VIDYORA
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute right-2 top-2 bg-destructive">
                  {discount}% OFF
                </Badge>
              )}
            </div>
          </Link>

          <div className="space-y-2">
            <Link
              href={`/products/${product.slug}`}
              className="line-clamp-2 font-semibold hover:text-primary"
            >
              {product.name}
            </Link>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">{formatCurrency(price)}</span>
              {comparePrice ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(comparePrice)}
                </span>
              ) : null}
            </div>

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

          <div className="flex gap-2">
            {isAvailable && inStock ? (
              readOnly ? (
                <Button asChild className="w-full gap-2" size="sm">
                  <Link href={`/products/${product.slug}`}>
                    <ShoppingCart className="size-4" />
                    View
                  </Link>
                </Button>
              ) : (
                <Button
                  className="flex-1 gap-2"
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isPending}
                >
                  <ShoppingCart className="size-4" />
                  {isPending ? "Adding…" : "Add to Cart"}
                </Button>
              )
            ) : isAvailable && !inStock && !readOnly ? (
              <Button asChild variant="outline" className="flex-1 gap-2" size="sm">
                <Link href={`/products/${product.slug}`}>
                  <Bell className="size-4" />
                  Notify me
                </Link>
              </Button>
            ) : null}
            {!readOnly ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isPending}
                className="gap-2"
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

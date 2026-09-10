"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { GiftPackagingOption } from "@/components/products/gift-packaging-option";
import { FloatingAddToCartBar } from "@/components/products/floating-add-to-cart-bar";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ProductShareButton } from "@/components/products/product-share-button";

type ProductBuyActionsProps = {
  productId: string;
  variantId?: string;
  inStock: boolean;
  isInWishlist: boolean;
  productName: string;
  productText?: string;
  price: number;
  weightLabel?: string | null;
};

export function ProductBuyActions({
  productId,
  variantId,
  inStock,
  isInWishlist,
  productName,
  productText,
  price,
  weightLabel,
}: ProductBuyActionsProps) {
  const [giftPackaging, setGiftPackaging] = useState(false);

  return (
    <div className="space-y-4">
      <GiftPackagingOption
        selected={giftPackaging}
        onChange={setGiftPackaging}
      />

      <div id="product-main-actions" className="flex items-center gap-3">
        <AddToCartButton
          productId={productId}
          variantId={variantId}
          inStock={inStock}
          giftPackaging={giftPackaging}
          className="flex-1 shadow-[0_10px_28px_rgba(139,46,46,0.28)]"
        />
        <WishlistButton productId={productId} isInWishlist={isInWishlist} />
        <ProductShareButton title={productName} text={productText} />
      </div>

      <FloatingAddToCartBar
        productId={productId}
        variantId={variantId}
        price={price}
        weightLabel={weightLabel}
        inStock={inStock}
        giftPackaging={giftPackaging}
      />
    </div>
  );
}

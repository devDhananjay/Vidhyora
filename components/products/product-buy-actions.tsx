"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { BuyNowButton } from "@/components/products/buy-now-button";
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
  whatsappNumber?: string;
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
  whatsappNumber,
}: ProductBuyActionsProps) {
  const [giftPackaging, setGiftPackaging] = useState(false);

  return (
    <div className="space-y-4">
      <GiftPackagingOption
        selected={giftPackaging}
        onChange={setGiftPackaging}
      />

      <div id="product-main-actions" className="space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <AddToCartButton
            productId={productId}
            variantId={variantId}
            inStock={inStock}
            giftPackaging={giftPackaging}
            className="w-full shadow-[0_10px_28px_rgba(139,46,46,0.28)]"
          />
          <BuyNowButton
            productId={productId}
            variantId={variantId}
            inStock={inStock}
            giftPackaging={giftPackaging}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <WishlistButton productId={productId} isInWishlist={isInWishlist} />
          <ProductShareButton
            title={productName}
            text={productText}
            whatsappNumber={whatsappNumber}
          />
        </div>
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

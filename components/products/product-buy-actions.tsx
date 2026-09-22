"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { BuyNowButton } from "@/components/products/buy-now-button";
import { GiftPackagingOption } from "@/components/products/gift-packaging-option";
import { FloatingAddToCartBar } from "@/components/products/floating-add-to-cart-bar";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ProductShareButton } from "@/components/products/product-share-button";
import { ProductAlertNotify } from "@/components/products/product-alert-notify";

type ProductBuyActionsProps = {
  productId: string;
  variantId?: string;
  inStock: boolean;
  isInWishlist: boolean;
  productName: string;
  productText?: string;
  price: number;
  sizeLabel?: string | null;
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
  sizeLabel,
  weightLabel,
  whatsappNumber,
}: ProductBuyActionsProps) {
  const [giftPackaging, setGiftPackaging] = useState(false);

  return (
    <div className="space-y-4">
      {inStock ? (
        <GiftPackagingOption
          selected={giftPackaging}
          onChange={setGiftPackaging}
        />
      ) : null}

      <div id="product-main-actions" className="space-y-3">
        {inStock ? (
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
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-700">Out of stock</p>
            <ProductAlertNotify
              productId={productId}
              productName={productName}
              type="BACK_IN_STOCK"
              variantId={variantId}
              asButton
              triggerLabel="Notify me"
              triggerClassName="h-12 w-full rounded-full border-2 border-[#8b2e2e] bg-white text-sm font-semibold text-[#8b2e2e] hover:bg-[#8b2e2e] hover:text-white"
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <WishlistButton productId={productId} isInWishlist={isInWishlist} />
          <ProductShareButton
            title={productName}
            text={productText}
            whatsappNumber={whatsappNumber}
          />
        </div>
      </div>

      {inStock ? (
        <FloatingAddToCartBar
          productId={productId}
          variantId={variantId}
          price={price}
          sizeLabel={sizeLabel}
          weightLabel={weightLabel}
          inStock={inStock}
          giftPackaging={giftPackaging}
        />
      ) : null}
    </div>
  );
}

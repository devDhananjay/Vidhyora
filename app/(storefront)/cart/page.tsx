import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCart } from "@/actions/cart/get-cart";
import { getPublicOffers } from "@/actions/content/get-offers";
import {
  calculateCartSubtotal,
  calculateCartSummary,
} from "@/lib/cart/cart-utils";
import { resolveCartCouponDiscount } from "@/lib/coupons/coupon-utils";
import { CartItemCard } from "@/components/cart/cart-item-card";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { SavedForLaterSection } from "@/components/cart/saved-for-later-section";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Shopping Cart | VIDYORA",
  description: "Review your cart and proceed to checkout",
};

export default async function CartPage() {
  const cart = await getCart();

  if (!cart) {
    redirect("/login?callbackUrl=/cart");
  }

  const activeItems = cart.items.filter((item) => !item.savedForLater);
  const savedItems = cart.items.filter((item) => item.savedForLater);

  if (activeItems.length === 0 && savedItems.length === 0) {
    return <EmptyCart />;
  }

  const subtotal = calculateCartSubtotal(cart);
  const [applied, offers] = await Promise.all([
    resolveCartCouponDiscount(cart.couponCode, cart.userId, subtotal),
    getPublicOffers(),
  ]);
  const summary = calculateCartSummary(cart, {
    discount: applied?.discount ?? 0,
    couponCode: applied?.code ?? null,
  });
  const availablePromos = offers.map((offer) => ({
    id: offer.id,
    code: offer.code,
    description: offer.description,
    discountType: offer.discountType,
    discountValue: Number(offer.discountValue),
    minimumOrderValue: Number(offer.minimumOrderValue),
    maximumDiscount: offer.maximumDiscount
      ? Number(offer.maximumDiscount)
      : null,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="size-8" />
        <h1 className="font-serif text-4xl text-neutral-900">Shopping Cart</h1>
      </div>

      {activeItems.length === 0 ? (
        <div className="mb-8 rounded-lg border border-orange-200 bg-orange-50 p-6 text-center">
          <p className="text-orange-700">
            Your cart is empty. Move items from &quot;Saved for Later&quot; to
            continue shopping.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="mb-4 text-lg font-medium">
              Cart Items ({activeItems.length})
            </div>
            <div className="space-y-4">
              {activeItems.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary
                summary={summary}
                availablePromos={availablePromos}
              />
            </div>
          </div>
        </div>
      )}

      {/* Saved for Later */}
      {savedItems.length > 0 && (
        <div className="mt-12">
          <SavedForLaterSection items={savedItems} />
        </div>
      )}
    </div>
  );
}

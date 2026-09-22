import type { Metadata } from "next";
import { getCart } from "@/actions/cart/get-cart";
import { getPublicOffers } from "@/actions/content/get-offers";
import {
  calculateCartSubtotal,
  calculateCartSummary,
  cartStockIssueMessage,
} from "@/lib/cart/cart-utils";
import { resolveCartCouponDiscount } from "@/lib/coupons/coupon-utils";
import { getCommerceSettings } from "@/lib/content/commerce-settings";
import { CartItemCard } from "@/components/cart/cart-item-card";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { SavedForLaterSection } from "@/components/cart/saved-for-later-section";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Shopping Cart | VIDYORA",
  description: "Review your cart and proceed to checkout",
};

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<{ stock?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const cart = await getCart();

  if (!cart) {
    return <EmptyCart />;
  }

  const activeItems = cart.items.filter((item) => !item.savedForLater);
  const savedItems = cart.items.filter((item) => item.savedForLater);

  if (activeItems.length === 0 && savedItems.length === 0) {
    return <EmptyCart />;
  }

  const subtotal = calculateCartSubtotal(cart);
  const [applied, offers, commerce] = await Promise.all([
    resolveCartCouponDiscount(cart.couponCode, cart.userId, subtotal),
    getPublicOffers(),
    getCommerceSettings(),
  ]);
  const summary = calculateCartSummary(cart, {
    discount: applied?.discount ?? 0,
    couponCode: applied?.code ?? null,
    freeShippingThreshold: commerce.freeShippingThreshold,
    shippingFee: commerce.shippingFee,
    fastDeliveryFee: commerce.fastDeliveryFee,
    fastDeliveryEnabled: commerce.fastDeliveryEnabled,
    gstPercent: commerce.gstPercent,
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
  const stockIssue = cartStockIssueMessage(cart);
  const redirectedForStock = params.stock === "1";

  return (
    <div className="container mx-auto px-4 py-8 pb-28 lg:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="size-8 text-[#8b2e2e]" />
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Shopping Cart
        </h1>
      </div>

      {redirectedForStock || stockIssue ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {stockIssue ||
            "Some items in your cart are out of stock. Remove or update them before checkout."}
        </div>
      ) : null}

      {activeItems.length === 0 ? (
        <div className="mb-8 rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
          <p className="text-orange-700">
            Your cart is empty. Move items from &quot;Saved for Later&quot; to
            continue shopping.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
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

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28">
              <CartSummary
                summary={summary}
                availablePromos={availablePromos}
                stockIssue={stockIssue}
              />
            </div>
          </div>
        </div>
      )}

      {savedItems.length > 0 && (
        <div className="mt-12">
          <SavedForLaterSection items={savedItems} />
        </div>
      )}
    </div>
  );
}

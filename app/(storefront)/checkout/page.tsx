import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCart } from "@/actions/cart/get-cart";
import {
  calculateCartSubtotal,
  calculateCartSummary,
  cartHasStockIssue,
} from "@/lib/cart/cart-utils";
import { resolveCartCouponDiscount } from "@/lib/coupons/coupon-utils";
import { getCommerceSettings } from "@/lib/content/commerce-settings";
import { getIntegrationsSettings } from "@/lib/content/integrations-settings";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { ClientCheckout } from "@/components/checkout/client-checkout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout | VIDYORA",
  description: "Complete your purchase",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ buyNow?: string }>;
}) {
  const { buyNow: buyNowParam } = await searchParams;
  const buyNowItemId = buyNowParam?.trim() || "";

  const session = await auth();
  const cart = await getCart();

  if (!cart || cart.items.filter((i) => !i.savedForLater).length === 0) {
    redirect("/cart");
  }

  const checkoutCart =
    buyNowItemId.length > 0
      ? {
          ...cart,
          items: cart.items.filter(
            (item) => !item.savedForLater && item.id === buyNowItemId,
          ),
        }
      : cart;

  if (buyNowItemId && checkoutCart.items.length === 0) {
    redirect("/cart");
  }

  if (cartHasStockIssue(checkoutCart)) {
    redirect("/cart?stock=1");
  }

  const isGuest = !session?.user?.id;

  const addresses = session?.user?.id
    ? await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const subtotal = calculateCartSubtotal(checkoutCart);
  const [applied, commerce, integrations] = await Promise.all([
    resolveCartCouponDiscount(
      cart.couponCode,
      cart.userId,
      subtotal,
    ),
    getCommerceSettings(),
    getIntegrationsSettings(),
  ]);
  const summary = calculateCartSummary(checkoutCart, {
    discount: applied?.discount ?? 0,
    couponCode: applied?.code ?? null,
    freeShippingThreshold: commerce.freeShippingThreshold,
    shippingFee: commerce.shippingFee,
    fastDeliveryFee: commerce.fastDeliveryFee,
    fastDeliveryEnabled: commerce.fastDeliveryEnabled,
    gstPercent: commerce.gstPercent,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 font-serif text-3xl text-neutral-900 sm:text-4xl">
        Checkout
      </h1>
      {buyNowItemId ? (
        <p className="mb-4 text-sm text-neutral-500">
          Buying this item only — other cart items stay in your bag.
        </p>
      ) : null}
      {isGuest ? (
        <p className="mb-6 text-sm text-neutral-500">
          Checking out as guest.{" "}
          <Link
            href="/login?callbackUrl=/checkout"
            className="font-medium text-[#8b2e2e] underline-offset-2 hover:underline"
          >
            Sign in
          </Link>{" "}
          to use a saved address.
        </p>
      ) : (
        <div className="mb-6" />
      )}

      <CheckoutSteps currentStep={1} />

      <ClientCheckout
        addresses={addresses}
        cart={checkoutCart}
        summary={summary}
        codEnabled={commerce.codEnabled}
        giftNotesEnabled={integrations.giftNotesEnabled}
        isGuest={isGuest}
        buyNowItemId={buyNowItemId || undefined}
      />
    </div>
  );
}

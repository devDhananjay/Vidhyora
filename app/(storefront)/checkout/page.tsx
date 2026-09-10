import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCart } from "@/actions/cart/get-cart";
import {
  calculateCartSubtotal,
  calculateCartSummary,
} from "@/lib/cart/cart-utils";
import { resolveCartCouponDiscount } from "@/lib/coupons/coupon-utils";
import { getCommerceSettings } from "@/lib/content/commerce-settings";
import { getIntegrationsSettings } from "@/lib/content/integrations-settings";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { ClientCheckout } from "@/components/checkout/client-checkout";

export const metadata: Metadata = {
  title: "Checkout | VIDYORA",
  description: "Complete your purchase",
};

export default async function CheckoutPage() {
  const session = await requireAuth();
  const cart = await getCart();

  if (!cart || cart.items.filter((i) => !i.savedForLater).length === 0) {
    redirect("/cart");
  }

  // Get user addresses
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const subtotal = calculateCartSubtotal(cart);
  const [applied, commerce, integrations] = await Promise.all([
    resolveCartCouponDiscount(cart.couponCode, cart.userId, subtotal),
    getCommerceSettings(),
    getIntegrationsSettings(),
  ]);
  const summary = calculateCartSummary(cart, {
    discount: applied?.discount ?? 0,
    couponCode: applied?.code ?? null,
    freeShippingThreshold: commerce.freeShippingThreshold,
    shippingFee: commerce.shippingFee,
    gstPercent: commerce.gstPercent,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-serif text-3xl text-neutral-900 sm:text-4xl">Checkout</h1>

      <CheckoutSteps currentStep={1} />

      <ClientCheckout
        addresses={addresses}
        cart={cart}
        summary={summary}
        codEnabled={commerce.codEnabled}
        giftNotesEnabled={integrations.giftNotesEnabled}
      />
    </div>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getGuestCartToken } from "@/lib/cart/cart-session";
import { getCartItemCount } from "@/lib/cart/cart-utils";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export async function CartIndicator() {
  const session = await auth();

  let cart = null;

  if (session?.user?.id) {
    cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          where: { savedForLater: false },
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  } else {
    const guestToken = await getGuestCartToken();
    if (guestToken) {
      cart = await prisma.cart.findUnique({
        where: { guestToken },
        include: {
          items: {
            where: { savedForLater: false },
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
    }
  }

  const itemCount = cart ? getCartItemCount(cart) : 0;

  return (
    <Link
      href="/cart"
      className="relative rounded-full p-2 hover:bg-accent"
      aria-label={
        itemCount > 0
          ? `Shopping cart with ${itemCount} items`
          : "Shopping cart"
      }
    >
      <ShoppingBag className="size-5 text-[#8b2e2e]" strokeWidth={1.5} />
      {itemCount > 0 ? (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-xs"
        >
          {itemCount > 9 ? "9+" : itemCount}
        </Badge>
      ) : null}
    </Link>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCartItemCount } from "@/lib/cart/cart-utils";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export async function CartIndicator() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/cart"
        className="relative rounded-full p-2 hover:bg-accent"
        aria-label="Shopping cart"
      >
        <ShoppingBag className="size-5 text-[#8b2e2e]" strokeWidth={1.5} />
      </Link>
    );
  }

  const cart = await prisma.cart.findUnique({
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

  const itemCount = cart ? getCartItemCount(cart) : 0;

  return (
    <Link
      href="/cart"
      className="relative rounded-full p-2 hover:bg-accent"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingBag className="size-5 text-[#8b2e2e]" strokeWidth={1.5} />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-xs"
        >
          {itemCount > 9 ? "9+" : itemCount}
        </Badge>
      )}
    </Link>
  );
}

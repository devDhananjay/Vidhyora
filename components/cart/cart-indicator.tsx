import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getGuestCartToken } from "@/lib/cart/cart-session";
import { getCartItemCount } from "@/lib/cart/cart-utils";
import { CartBagButton } from "@/components/cart/cart-drawer";

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

  return <CartBagButton itemCount={itemCount} />;
}

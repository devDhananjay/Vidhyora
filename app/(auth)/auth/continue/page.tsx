import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeCallbackPath } from "@/lib/auth/callback-url";
import { dashboardPath } from "@/lib/roles";

export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.id) {
    try {
      const { mergeGuestCartIntoUser } = await import(
        "@/lib/cart/cart-session"
      );
      await mergeGuestCartIntoUser(session.user.id);
    } catch (mergeError) {
      console.error("Guest cart merge failed:", mergeError);
    }
    try {
      const { mergeGuestWishlistIntoUser } = await import(
        "@/lib/wishlist/wishlist-session"
      );
      await mergeGuestWishlistIntoUser(session.user.id);
    } catch (mergeError) {
      console.error("Guest wishlist merge failed:", mergeError);
    }
  }

  const { callbackUrl } = await searchParams;
  redirect(safeCallbackPath(callbackUrl) ?? dashboardPath(session.user.role));
}

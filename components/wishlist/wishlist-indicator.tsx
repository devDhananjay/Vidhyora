import { getWishlist } from "@/actions/wishlist/manage-wishlist";
import { WishlistHeartButton } from "@/components/wishlist/wishlist-drawer";

export async function WishlistIndicator() {
  const { items } = await getWishlist();
  return <WishlistHeartButton itemCount={items.length} />;
}

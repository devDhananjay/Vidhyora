import type { Metadata } from "next";
import { getWishlist } from "@/actions/wishlist/manage-wishlist";
import { AccountBackLink } from "@/components/account/account-back-link";
import { WishlistItem } from "@/components/wishlist/wishlist-item";
import { EmptyWishlist } from "@/components/wishlist/empty-wishlist";

export const metadata: Metadata = {
  title: "My Wishlist | VIDYORA",
};

export default async function WishlistPage() {
  const items = await getWishlist();

  return (
    <div className="bg-[#faf8f6]">
      <div className="container mx-auto px-4 py-8">
        <AccountBackLink />
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
            My Wishlist
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <WishlistItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

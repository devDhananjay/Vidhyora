import type { Metadata } from "next";
import { getWishlist } from "@/actions/wishlist/manage-wishlist";
import { AccountBackLink } from "@/components/account/account-back-link";
import { WishlistItem } from "@/components/wishlist/wishlist-item";
import { EmptyWishlist } from "@/components/wishlist/empty-wishlist";
import { WishlistShareButton } from "@/components/wishlist/wishlist-share-button";

export const metadata: Metadata = {
  title: "My Wishlist",
};

export default async function WishlistPage() {
  const { items, shareToken } = await getWishlist();

  return (
    <div className="bg-[#faf8f6]">
      <div className="container mx-auto px-4 py-8">
        <AccountBackLink />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-brand sm:text-4xl">
              My Wishlist
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          {items.length > 0 ? (
            <WishlistShareButton initialShareToken={shareToken} />
          ) : null}
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

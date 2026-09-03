import type { Metadata} from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { getWishlist } from "@/actions/wishlist/manage-wishlist";
import { Card, CardContent } from "@/components/ui/card";
import { WishlistItem } from "@/components/wishlist/wishlist-item";

export const metadata: Metadata = {
  title: "My Wishlist | VIDYORA",
};

export default async function WishlistPage() {
  const session = await requireAuth();

  if (!session) {
    redirect("/login?callbackUrl=/wishlist");
  }

  const items = await getWishlist();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-neutral-900">My Wishlist</h1>
        <p className="mt-2 text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">💝</div>
            <h3 className="mb-2 text-lg font-semibold">Your wishlist is empty</h3>
            <p className="text-muted-foreground">
              Save items you love to buy them later
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <WishlistItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

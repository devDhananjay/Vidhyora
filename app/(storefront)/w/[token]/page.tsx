import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSharedWishlist } from "@/actions/wishlist/manage-wishlist";
import { WishlistItem } from "@/components/wishlist/wishlist-item";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Shared wishlist | VIDYORA",
  robots: { index: false, follow: false },
};

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await getSharedWishlist(token);
  if (!shared) notFound();

  return (
    <div className="bg-[#faf8f6]">
      <div className="container mx-auto px-4 py-10">
        <p className="text-xs tracking-[0.18em] text-[#8b2e2e] uppercase">
          Shared collection
        </p>
        <h1 className="mt-2 font-serif text-3xl text-neutral-900 sm:text-4xl">
          A VIDYORA wishlist
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-500">
          {shared.items.length}{" "}
          {shared.items.length === 1 ? "piece" : "pieces"} saved for browsing.
          Open any item to buy, or start your own list.
        </p>

        {shared.items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-500">
              This shared list is empty right now.
            </p>
            <Button asChild className="mt-4 rounded-full bg-[#8b2e2e] hover:bg-[#7a2828]">
              <Link href="/products">Browse jewellery</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shared.items.map((item) => (
              <WishlistItem key={item.id} item={item} readOnly />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

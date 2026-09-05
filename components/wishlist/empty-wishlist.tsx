import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyWishlist() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ead9c4]/90 bg-gradient-to-b from-[#faf6f0] to-white px-6 py-14 text-center sm:px-10 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(139,46,46,0.06), transparent 42%), radial-gradient(circle at 80% 70%, rgba(176,141,87,0.1), transparent 45%)",
        }}
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <p className="font-serif text-[11px] tracking-[0.35em] text-[#8b2e2e] uppercase">
          Favourites
        </p>

        <div className="relative mt-6 flex size-24 items-center justify-center sm:size-28">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[#8b2e2e]/8"
          />
          <span
            aria-hidden
            className="absolute inset-3 rounded-full border border-[#ead9c4] bg-white shadow-[0_12px_32px_rgba(139,46,46,0.1)]"
          />
          <Heart
            className="relative size-10 text-[#8b2e2e] sm:size-11"
            strokeWidth={1.4}
          />
          <Sparkles
            aria-hidden
            className="absolute top-2 right-1 size-4 text-[#b08d57]"
            strokeWidth={1.6}
          />
        </div>

        <div className="mt-6 h-px w-14 bg-gradient-to-r from-transparent via-[#c9a227]/80 to-transparent" />

        <h2 className="mt-5 font-serif text-2xl text-neutral-900 sm:text-3xl">
          Your wishlist is waiting
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
          Save the pieces you love — rings, necklaces, and everyday sparkle —
          and return to them anytime.
        </p>

        <Button
          asChild
          className="mt-8 h-11 rounded-full bg-[#8b2e2e] px-8 text-white hover:bg-[#7a2727]"
        >
          <Link href="/products">Explore jewellery</Link>
        </Button>
      </div>
    </div>
  );
}

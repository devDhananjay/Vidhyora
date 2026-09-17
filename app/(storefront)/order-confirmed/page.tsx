import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order confirmed | VIDYORA",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.n?.trim();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#f3ebe4] text-[#8b2e2e]">
        <CheckCircle2 className="size-8" strokeWidth={1.6} />
      </span>
      <h1 className="mt-6 font-serif text-3xl text-neutral-900">
        Thank you for your order
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        We have received your jewellery order
        {orderNumber ? (
          <>
            {" "}
            <span className="font-semibold text-neutral-900">
              #{orderNumber}
            </span>
          </>
        ) : null}
        . A confirmation email is on its way.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Create an account with the same email anytime to track orders in your
        dashboard.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-full bg-[#8b2e2e] hover:bg-[#7a2828]">
          <Link href="/products">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}

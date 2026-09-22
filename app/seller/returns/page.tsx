import type { Metadata } from "next";
import { Suspense } from "react";
import { getSellerReturns } from "@/actions/seller/get-returns";
import { ReturnsWorkspace } from "@/components/returns/returns-workspace";

export const metadata: Metadata = {
  title: "Returns & Replacements | Seller Admin",
};

export default async function SellerReturnsPage() {
  const returns = await getSellerReturns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Returns & Replacements
        </h1>
        <p className="mt-2 text-muted-foreground">
          Approve or reject customer requests for your store. Track each request
          from pending through completion.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ReturnsWorkspace
          items={returns}
          emptyMessage="No return or replacement requests for this seller admin yet."
        />
      </Suspense>
    </div>
  );
}

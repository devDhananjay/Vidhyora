import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllReturnRequests } from "@/actions/admin/manage-returns";
import { ReturnsWorkspace } from "@/components/returns/returns-workspace";

export const metadata: Metadata = {
  title: "Returns & Replacements | Admin",
};

export default async function AdminReturnsPage() {
  const returns = await getAllReturnRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Returns & Replacements
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review customer return and replacement requests across all seller
          admins. Approve, reject, or complete from here.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ReturnsWorkspace
          items={returns}
          showSeller
          emptyMessage="No return or replacement requests yet."
        />
      </Suspense>
    </div>
  );
}

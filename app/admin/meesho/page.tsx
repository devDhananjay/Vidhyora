import type { Metadata } from "next";
import {
  getMeeshoListingStats,
  getMeeshoListings,
} from "@/actions/admin/manage-meesho-listings";
import { MeeshoSyncPanel } from "@/components/admin/meesho-sync-panel";

export const metadata: Metadata = {
  title: "Meesho sync | Admin",
};

export default async function AdminMeeshoPage() {
  const [listings, stats] = await Promise.all([
    getMeeshoListings({ status: "ALL" }),
    getMeeshoListingStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Meesho sync
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Website pe list → Meesho queue auto-ready. CSV download karke Meesho
          Bulk Upload pe daalo; QC Pass ke baad yahan Live mark karo.
        </p>
      </div>
      <MeeshoSyncPanel listings={listings} stats={stats} />
    </div>
  );
}

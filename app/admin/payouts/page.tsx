import type { Metadata } from "next";
import { getPayoutOverview } from "@/actions/admin/manage-payouts";
import { AdminPayoutsPanel } from "@/components/admin/admin-payouts-panel";
import { StatCard } from "@/components/seller/stat-card";
import { formatCurrency } from "@/lib/utils";
import { Banknote, CheckCircle2, Percent, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Payouts | Admin",
};

export default async function AdminPayoutsPage() {
  const { totals, sellers, payouts } = await getPayoutOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Payouts
        </h1>
        <p className="mt-2 text-muted-foreground">
          Paid orders split into seller share and platform commission. Settle
          when you have transferred the net amount to the seller admin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="GMV (paid items)"
          value={formatCurrency(totals.gmv)}
          icon={Banknote}
          description="Gross merchandise value"
        />
        <StatCard
          title="Commission earned"
          value={formatCurrency(totals.commissionEarned)}
          icon={Percent}
          description="Platform share"
        />
        <StatCard
          title="Pending payouts"
          value={formatCurrency(totals.pendingPayouts)}
          icon={Wallet}
          description="Awaiting settlement"
        />
        <StatCard
          title="Settled to sellers"
          value={formatCurrency(totals.settled)}
          icon={CheckCircle2}
          description="Already transferred"
        />
      </div>

      <AdminPayoutsPanel sellers={sellers} payouts={payouts} />
    </div>
  );
}

import type { Metadata } from "next";
import { getSellerPayments } from "@/actions/seller/get-payments";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/seller/stat-card";
import { SellerPaymentsPanel } from "@/components/seller/seller-payments-panel";
import { DEFAULT_COMMISSION_PERCENTAGE } from "@/lib/commission";
import { formatCurrency } from "@/lib/utils";
import { Banknote, CheckCircle2, Percent, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Payments | Seller Admin",
};

export default async function SellerPaymentsPage() {
  const data = await getSellerPayments();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Payments
        </h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No seller account is available to review yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totals, earnings, payouts, profile } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Payments
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sales after Super Admin commission. Payouts are released when Super
          Admin settles your available balance.
          {profile
            ? ` Your seller rate is ${profile.commissionPercentage}%; category rates override when set (platform default ${DEFAULT_COMMISSION_PERCENTAGE}% if neither applies).`
            : ` Platform default is ${DEFAULT_COMMISSION_PERCENTAGE}% unless a category rate applies.`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total sales"
          value={formatCurrency(totals.gross)}
          icon={Banknote}
          description="Gross from paid orders"
        />
        <StatCard
          title="Commission deducted"
          value={formatCurrency(totals.commission)}
          icon={Percent}
          description="Platform share"
        />
        <StatCard
          title="Available payout"
          value={formatCurrency(totals.available)}
          icon={Wallet}
          description="Ready to settle"
        />
        <StatCard
          title="Already settled"
          value={formatCurrency(totals.paid)}
          icon={CheckCircle2}
          description="Paid out to you"
        />
      </div>

      <SellerPaymentsPanel
        earnings={earnings}
        payouts={payouts}
        bank={
          profile?.bankAccountNumber
            ? {
                bankName: profile.bankName,
                bankAccountNumber: profile.bankAccountNumber,
                bankIfscCode: profile.bankIfscCode,
              }
            : null
        }
      />
    </div>
  );
}

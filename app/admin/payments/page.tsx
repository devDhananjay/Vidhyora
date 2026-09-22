import type { Metadata } from "next";
import { getAllPayments } from "@/actions/admin/get-payments";
import { AdminPaymentsPanel } from "@/components/admin/admin-payments-panel";
import { StatCard } from "@/components/seller/stat-card";
import { formatCurrency } from "@/lib/utils";
import { Banknote, CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Payments | Admin",
};

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments();
  const captured = payments.filter((p) => p.status === "CAPTURED");
  const failed = payments.filter((p) => p.status === "FAILED");
  const capturedTotal = captured.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Payments
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gateway records across all orders. Filter by status or search
          customer / transaction.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total records"
          value={payments.length}
          icon={Banknote}
          description="All payment attempts"
        />
        <StatCard
          title="Captured"
          value={formatCurrency(capturedTotal)}
          icon={CheckCircle2}
          description={`${captured.length} successful`}
        />
        <StatCard
          title="Failed"
          value={failed.length}
          icon={XCircle}
          description="Needs attention"
        />
      </div>

      <AdminPaymentsPanel
        payments={payments.map((p) => ({
          id: p.id,
          provider: p.provider,
          transactionId: p.transactionId,
          amount: Number(p.amount),
          status: p.status,
          createdAt: p.createdAt,
          order: p.order,
        }))}
      />
    </div>
  );
}

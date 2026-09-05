import type { Metadata } from "next";
import Link from "next/link";
import { getAllPayments } from "@/actions/admin/get-payments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Payments | Super Admin",
};

function statusBadge(status: string) {
  if (status === "CAPTURED") return <Badge className="bg-green-600">Captured</Badge>;
  if (status === "AUTHORIZED") return <Badge className="bg-yellow-600">Authorized</Badge>;
  if (status === "FAILED") return <Badge variant="destructive">Failed</Badge>;
  if (status === "REFUNDED") return <Badge variant="outline">Refunded</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments();
  const captured = payments.filter((p) => p.status === "CAPTURED");
  const capturedTotal = captured.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Payments</h1>
        <p className="mt-2 text-muted-foreground">
          {payments.length} records • {formatCurrency(capturedTotal)} captured
        </p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payments yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full">
              <thead className="border-b text-left text-sm text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Transaction</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${payment.order.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {payment.order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{payment.order.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.order.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">{payment.provider}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {payment.transactionId || "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(Number(payment.amount))}
                    </td>
                    <td className="px-6 py-4">{statusBadge(payment.status)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

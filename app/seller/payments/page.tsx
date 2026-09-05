import type { Metadata } from "next";
import { getSellerPayments } from "@/actions/seller/get-payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Payments | Seller Admin",
};

function earningBadge(status: string) {
  if (status === "AVAILABLE") {
    return <Badge className="bg-amber-600">Available</Badge>;
  }
  if (status === "INCLUDED") {
    return <Badge className="bg-green-600">Paid out</Badge>;
  }
  if (status === "REVERSED") {
    return <Badge className="bg-neutral-500">Reversed</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export default async function SellerPaymentsPage() {
  const data = await getSellerPayments();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Payments</h1>
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
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Payments</h1>
        <p className="mt-2 text-muted-foreground">
          Sales after Super Admin commission. Payouts are released when Super
          Admin settles your available balance.
          {profile
            ? ` Current rate ${profile.commissionPercentage}% unless a category rate overrides it.`
            : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total sales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.gross)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Commission deducted</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.commission)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available payout</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.available)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Already settled</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.paid)}
          </CardContent>
        </Card>
      </div>

      {profile?.bankAccountNumber ? (
        <Card>
          <CardHeader>
            <CardTitle>Payout account</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {profile.bankName || "Bank"} · ****
            {profile.bankAccountNumber.slice(-4)}
            {profile.bankIfscCode ? ` · ${profile.bankIfscCode}` : ""}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {earnings.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              No paid orders yet. Earnings appear after a customer payment is
              captured.
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b text-left text-sm text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium">Gross</th>
                  <th className="px-6 py-3 font-medium">Rate</th>
                  <th className="px-6 py-3 font-medium">Commission</th>
                  <th className="px-6 py-3 font-medium">Your share</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{row.orderNumber}</td>
                    <td className="px-6 py-4">{row.productName}</td>
                    <td className="px-6 py-4">
                      {formatCurrency(row.grossAmount)}
                    </td>
                    <td className="px-6 py-4">{row.commissionRate}%</td>
                    <td className="px-6 py-4">
                      {formatCurrency(row.commissionAmount)}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(row.netAmount)}
                    </td>
                    <td className="px-6 py-4">{earningBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No settlements yet
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div className="font-medium">
                      {formatCurrency(payout.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(payout.createdAt), "dd MMM yyyy")}
                      {payout.note ? ` • ${payout.note}` : ""}
                    </div>
                  </div>
                  <Badge
                    className={
                      payout.status === "PAID"
                        ? "bg-green-600"
                        : payout.status === "FAILED"
                          ? "bg-red-600"
                          : "bg-amber-600"
                    }
                  >
                    {payout.status === "PAID"
                      ? "Paid"
                      : payout.status === "FAILED"
                        ? "Failed"
                        : payout.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

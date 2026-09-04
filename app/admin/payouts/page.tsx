import type { Metadata } from "next";
import Link from "next/link";
import { getPayoutOverview } from "@/actions/admin/manage-payouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettlePayoutButton } from "@/components/admin/settle-payout-button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Payouts | Super Admin",
};

export default async function AdminPayoutsPage() {
  const { totals, sellers, payouts } = await getPayoutOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Payouts</h1>
        <p className="mt-2 text-muted-foreground">
          Paid orders split into seller share and platform commission. Settle
          when you have transferred the net amount to the seller admin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">GMV (paid items)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.gmv)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Commission earned</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.commissionEarned)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending payouts</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.pendingPayouts)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Settled to sellers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totals.settled)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seller balances</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {sellers.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              No seller admins yet
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b text-left text-sm text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Seller admin</th>
                  <th className="px-6 py-3 font-medium">Rate</th>
                  <th className="px-6 py-3 font-medium">Available GMV</th>
                  <th className="px-6 py-3 font-medium">Commission</th>
                  <th className="px-6 py-3 font-medium">Net payable</th>
                  <th className="px-6 py-3 font-medium">Already paid</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.sellerId} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/sellers/${seller.sellerId}`}
                        className="font-medium hover:text-primary"
                      >
                        {seller.businessName}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {seller.seller.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">{seller.commissionPercentage}%</td>
                    <td className="px-6 py-4">
                      {formatCurrency(seller.availableGross)}
                    </td>
                    <td className="px-6 py-4">
                      {formatCurrency(seller.availableCommission)}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(seller.availableNet)}
                    </td>
                    <td className="px-6 py-4">
                      {formatCurrency(seller.paidNet)}
                    </td>
                    <td className="px-6 py-4">
                      {seller.availableNet > 0 ? (
                        <SettlePayoutButton
                          sellerId={seller.sellerId}
                          amountLabel={formatCurrency(seller.availableNet)}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Nothing due
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settlement history</CardTitle>
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
                      {payout.seller.businessName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payout._count.earnings} items •{" "}
                      {format(new Date(payout.createdAt), "dd MMM yyyy")}
                      {payout.note ? ` • ${payout.note}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(payout.amount)}
                    </div>
                    <Badge className="mt-1 bg-green-600">{payout.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

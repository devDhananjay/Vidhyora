"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FilteredList } from "@/components/dashboard/filtered-list";
import { SettlePayoutButton } from "@/components/admin/settle-payout-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type AdminSellerBalanceRow = {
  sellerId: string;
  businessName: string;
  commissionPercentage: number;
  availableGross: number;
  availableCommission: number;
  availableNet: number;
  paidNet: number;
  seller: { email: string };
};

export type AdminSettlementRow = {
  id: string;
  amount: number;
  status: string;
  utr: string | null;
  note: string | null;
  createdAt: string | Date;
  seller: { businessName: string };
  _count: { earnings: number };
};

const BALANCE_FILTERS = [
  { id: "all", label: "All" },
  { id: "due", label: "Due now" },
  { id: "cleared", label: "Nothing due" },
];

const HISTORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "PAID", label: "Paid" },
  { id: "PENDING", label: "Pending" },
  { id: "FAILED", label: "Failed" },
];

function matchBalance(item: AdminSellerBalanceRow, filterId: string) {
  if (filterId === "due") return item.availableNet > 0;
  if (filterId === "cleared") return item.availableNet <= 0;
  return true;
}

function balanceSearch(item: AdminSellerBalanceRow) {
  return `${item.businessName} ${item.seller.email}`;
}

function matchSettlement(item: AdminSettlementRow, filterId: string) {
  return item.status === filterId;
}

function settlementSearch(item: AdminSettlementRow) {
  return `${item.seller.businessName} ${item.utr ?? ""} ${item.note ?? ""} ${item.status}`;
}

export function AdminPayoutsPanel({
  sellers,
  payouts,
}: {
  sellers: AdminSellerBalanceRow[];
  payouts: AdminSettlementRow[];
}) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[#ead9c4]/80">
        <CardHeader className="border-b border-[#ead9c4]/60 bg-[#faf7f5]/40">
          <CardTitle className="font-serif text-xl text-neutral-900">
            Seller balances
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Filter sellers with amount due, then settle after bank transfer.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {sellers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No seller admins yet
            </div>
          ) : (
            <FilteredList
              items={sellers}
              filters={BALANCE_FILTERS}
              matchFilter={matchBalance}
              searchText={balanceSearch}
              searchPlaceholder="Search seller…"
              emptyLabel="No sellers match this filter."
            >
              {(rows) => (
                <>
                  <div className="grid gap-3 lg:hidden">
                    {rows.map((seller) => (
                      <div
                        key={seller.sellerId}
                        className="rounded-xl border border-[#ead9c4]/80 bg-white p-4"
                      >
                        <Link
                          href={`/admin/sellers/${seller.sellerId}`}
                          className="font-medium hover:text-[#8b2e2e]"
                        >
                          {seller.businessName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {seller.seller.email} · {seller.commissionPercentage}%
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Net payable
                            </p>
                            <p className="font-serif text-xl text-brand">
                              {formatCurrency(seller.availableNet)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Already paid
                            </p>
                            <p className="font-serif text-lg text-brand">
                              {formatCurrency(seller.paidNet)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
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
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto rounded-xl border border-[#ead9c4]/70 lg:block">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead className="bg-[#faf7f5] text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Seller admin</th>
                          <th className="px-4 py-3 font-medium">Rate</th>
                          <th className="px-4 py-3 font-medium">Available GMV</th>
                          <th className="px-4 py-3 font-medium">Commission</th>
                          <th className="px-4 py-3 font-medium">Net payable</th>
                          <th className="px-4 py-3 font-medium">Already paid</th>
                          <th className="px-4 py-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((seller) => (
                          <tr
                            key={seller.sellerId}
                            className="border-t border-[#ead9c4]/50 transition hover:bg-[#faf7f5]/80"
                          >
                            <td className="px-4 py-3.5">
                              <Link
                                href={`/admin/sellers/${seller.sellerId}`}
                                className="font-medium hover:text-[#8b2e2e]"
                              >
                                {seller.businessName}
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                {seller.seller.email}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {seller.commissionPercentage}%
                            </td>
                            <td className="px-4 py-3.5 font-serif text-base text-brand">
                              {formatCurrency(seller.availableGross)}
                            </td>
                            <td className="px-4 py-3.5">
                              {formatCurrency(seller.availableCommission)}
                            </td>
                            <td className="px-4 py-3.5 font-serif text-base font-medium text-brand">
                              {formatCurrency(seller.availableNet)}
                            </td>
                            <td className="px-4 py-3.5">
                              {formatCurrency(seller.paidNet)}
                            </td>
                            <td className="px-4 py-3.5">
                              {seller.availableNet > 0 ? (
                                <SettlePayoutButton
                                  sellerId={seller.sellerId}
                                  amountLabel={formatCurrency(
                                    seller.availableNet,
                                  )}
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
                  </div>
                </>
              )}
            </FilteredList>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#ead9c4]/80">
        <CardHeader className="border-b border-[#ead9c4]/60 bg-[#faf7f5]/40">
          <CardTitle className="font-serif text-xl text-neutral-900">
            Settlement history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {payouts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No settlements yet
            </div>
          ) : (
            <FilteredList
              items={payouts}
              filters={HISTORY_FILTERS}
              matchFilter={matchSettlement}
              searchText={settlementSearch}
              searchPlaceholder="Search seller or UTR…"
              emptyLabel="No settlements in this status."
            >
              {(rows) => (
                <div className="space-y-3">
                  {rows.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#ead9c4]/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">
                          {payout.seller.businessName}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {payout._count.earnings} items ·{" "}
                          {format(new Date(payout.createdAt), "dd MMM yyyy")}
                          {payout.utr ? ` · UTR ${payout.utr}` : ""}
                          {payout.note ? ` · ${payout.note}` : ""}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-serif text-2xl text-brand">
                          {formatCurrency(payout.amount)}
                        </p>
                        <Badge className="mt-1 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FilteredList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

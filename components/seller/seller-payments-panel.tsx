"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Building2, Wallet } from "lucide-react";
import { FilteredList } from "@/components/dashboard/filtered-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type SellerEarningRow = {
  id: string;
  orderNumber: string;
  productName: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  createdAt: string | Date;
};

export type SellerPayoutRow = {
  id: string;
  amount: number;
  status: string;
  utr: string | null;
  note: string | null;
  createdAt: string | Date;
};

const EARNING_FILTERS = [
  { id: "all", label: "All" },
  { id: "AVAILABLE", label: "Available" },
  { id: "INCLUDED", label: "Paid out" },
  { id: "REVERSED", label: "Reversed" },
];

const PAYOUT_FILTERS = [
  { id: "all", label: "All" },
  { id: "PAID", label: "Paid" },
  { id: "PENDING", label: "Pending" },
  { id: "FAILED", label: "Failed" },
];

function earningBadge(status: string) {
  if (status === "AVAILABLE") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
        Available
      </Badge>
    );
  }
  if (status === "INCLUDED") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
        Paid out
      </Badge>
    );
  }
  if (status === "REVERSED") {
    return (
      <Badge className="border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-100">
        Reversed
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function payoutBadge(status: string) {
  if (status === "PAID") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
        Paid
      </Badge>
    );
  }
  if (status === "FAILED") {
    return (
      <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
        Failed
      </Badge>
    );
  }
  return (
    <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
      {status === "PENDING" ? "Pending" : status}
    </Badge>
  );
}

function matchEarningStatus(item: SellerEarningRow, filterId: string) {
  return item.status === filterId;
}

function earningSearchText(item: SellerEarningRow) {
  return `${item.orderNumber} ${item.productName} ${item.status}`;
}

function matchPayoutStatus(item: SellerPayoutRow, filterId: string) {
  return item.status === filterId;
}

function payoutSearchText(item: SellerPayoutRow) {
  return `${item.utr ?? ""} ${item.note ?? ""} ${item.status} ${item.amount}`;
}

export function SellerPaymentsPanel({
  earnings,
  payouts,
  bank,
}: {
  earnings: SellerEarningRow[];
  payouts: SellerPayoutRow[];
  bank?: {
    bankName: string | null;
    bankAccountNumber: string;
    bankIfscCode: string | null;
  } | null;
}) {
  return (
    <div className="space-y-6">
      {bank?.bankAccountNumber ? (
        <Card className="border-[#ead9c4]/80 bg-gradient-to-br from-[#faf7f5] to-white">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f6ead7] text-[#8b2e2e]">
                <Building2 className="size-4" strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Payout account
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {bank.bankName || "Bank"} · ****
                  {bank.bankAccountNumber.slice(-4)}
                  {bank.bankIfscCode ? ` · ${bank.bankIfscCode}` : ""}
                </p>
              </div>
            </div>
            <Link
              href="/seller/settings"
              className="text-sm font-medium text-[#8b2e2e] hover:underline"
            >
              Update in Settings
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-[#ead9c4]">
          <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#f6ead7] text-[#8b2e2e]">
                <Wallet className="size-4" />
              </span>
              <p className="text-sm text-muted-foreground">
                Add bank details so Super Admin can settle your payouts.
              </p>
            </div>
            <Link
              href="/seller/settings"
              className="text-sm font-medium text-[#8b2e2e] hover:underline"
            >
              Add payout account
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-[#ead9c4]/80">
        <CardHeader className="border-b border-[#ead9c4]/60 bg-[#faf7f5]/40">
          <CardTitle className="font-serif text-xl text-brand">
            Earnings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Per-item share after platform commission. Filter by payout status.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {earnings.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No paid orders yet. Earnings appear after a customer payment is
              captured.
            </div>
          ) : (
            <FilteredList
              items={earnings}
              filters={EARNING_FILTERS}
              matchFilter={matchEarningStatus}
              searchText={earningSearchText}
              searchPlaceholder="Search order or product…"
              emptyLabel="No earnings in this status."
            >
              {(rows) => (
                <>
                  {/* Mobile cards */}
                  <div className="grid gap-3 md:hidden">
                    {rows.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-xl border border-[#ead9c4]/80 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-900">
                              {row.orderNumber}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                              {row.productName}
                            </p>
                          </div>
                          {earningBadge(row.status)}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Gross</p>
                            <p className="font-serif text-lg text-brand">
                              {formatCurrency(row.grossAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Your share
                            </p>
                            <p className="font-serif text-lg text-brand">
                              {formatCurrency(row.netAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Rate</p>
                            <p>{row.commissionRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Commission
                            </p>
                            <p>{formatCurrency(row.commissionAmount)}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(row.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto rounded-xl border border-[#ead9c4]/70 md:block">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-[#faf7f5] text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Order</th>
                          <th className="px-4 py-3 font-medium">Item</th>
                          <th className="px-4 py-3 font-medium">Gross</th>
                          <th className="px-4 py-3 font-medium">Rate</th>
                          <th className="px-4 py-3 font-medium">Commission</th>
                          <th className="px-4 py-3 font-medium">Your share</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-t border-[#ead9c4]/50 transition hover:bg-[#faf7f5]/80"
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-medium">{row.orderNumber}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(row.createdAt), "dd MMM yyyy")}
                              </div>
                            </td>
                            <td className="max-w-[220px] px-4 py-3.5">
                              <span className="line-clamp-2">{row.productName}</span>
                            </td>
                            <td className="px-4 py-3.5 font-serif text-base text-brand">
                              {formatCurrency(row.grossAmount)}
                            </td>
                            <td className="px-4 py-3.5">{row.commissionRate}%</td>
                            <td className="px-4 py-3.5">
                              {formatCurrency(row.commissionAmount)}
                            </td>
                            <td className="px-4 py-3.5 font-serif text-base font-medium text-brand">
                              {formatCurrency(row.netAmount)}
                            </td>
                            <td className="px-4 py-3.5">
                              {earningBadge(row.status)}
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
          <CardTitle className="font-serif text-xl text-brand">
            Payout history
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Settlements released by Super Admin to your bank account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {payouts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No settlements yet
            </div>
          ) : (
            <FilteredList
              items={payouts}
              filters={PAYOUT_FILTERS}
              matchFilter={matchPayoutStatus}
              searchText={payoutSearchText}
              searchPlaceholder="Search UTR or note…"
              emptyLabel="No payouts in this status."
            >
              {(rows) => (
                <div className="space-y-3">
                  {rows.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#ead9c4]/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-serif text-2xl text-brand">
                          {formatCurrency(payout.amount)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {format(new Date(payout.createdAt), "dd MMM yyyy")}
                          {payout.utr ? ` · UTR ${payout.utr}` : ""}
                          {payout.note ? ` · ${payout.note}` : ""}
                        </p>
                        <Link
                          href={`/seller/payments/${payout.id}/advice`}
                          className="mt-2 inline-block text-sm font-medium text-[#8b2e2e] hover:underline"
                        >
                          Print payout advice
                        </Link>
                      </div>
                      {payoutBadge(payout.status)}
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

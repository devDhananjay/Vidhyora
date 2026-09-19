"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FilteredList } from "@/components/dashboard/filtered-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type AdminPaymentRow = {
  id: string;
  provider: string;
  transactionId: string | null;
  amount: number;
  status: string;
  createdAt: string | Date;
  order: {
    id: string;
    orderNumber: string;
    user: { name: string | null; email: string };
  };
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "CAPTURED", label: "Captured" },
  { id: "AUTHORIZED", label: "Authorized" },
  { id: "FAILED", label: "Failed" },
  { id: "REFUNDED", label: "Refunded" },
];

function statusBadge(status: string) {
  if (status === "CAPTURED") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
        Captured
      </Badge>
    );
  }
  if (status === "AUTHORIZED") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
        Authorized
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
  if (status === "REFUNDED") {
    return <Badge variant="outline">Refunded</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function matchStatus(item: AdminPaymentRow, filterId: string) {
  return item.status === filterId;
}

function searchText(item: AdminPaymentRow) {
  return [
    item.order.orderNumber,
    item.order.user.name,
    item.order.user.email,
    item.provider,
    item.transactionId,
    item.status,
  ]
    .filter(Boolean)
    .join(" ");
}

export function AdminPaymentsPanel({ payments }: { payments: AdminPaymentRow[] }) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No payments yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-[#ead9c4]/80">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <FilteredList
          items={payments}
          filters={FILTERS}
          matchFilter={matchStatus}
          searchText={searchText}
          searchPlaceholder="Search order, customer, txn…"
          emptyLabel="No payments in this status."
        >
          {(rows) => (
            <>
              <div className="grid gap-3 md:hidden">
                {rows.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-[#ead9c4]/80 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/orders/${payment.order.id}`}
                        className="font-medium hover:text-[#8b2e2e]"
                      >
                        {payment.order.orderNumber}
                      </Link>
                      {statusBadge(payment.status)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.order.user.name || payment.order.user.email}
                    </p>
                    <p className="mt-2 font-serif text-xl text-brand">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {payment.provider}
                      {payment.transactionId
                        ? ` · ${payment.transactionId}`
                        : ""}{" "}
                      · {format(new Date(payment.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border border-[#ead9c4]/70 md:block">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-[#faf7f5] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Provider</th>
                      <th className="px-4 py-3 font-medium">Transaction</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-t border-[#ead9c4]/50 transition hover:bg-[#faf7f5]/80"
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/admin/orders/${payment.order.id}`}
                            className="font-medium hover:text-[#8b2e2e]"
                          >
                            {payment.order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium">
                            {payment.order.user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.order.user.email}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{payment.provider}</td>
                        <td className="px-4 py-3.5 font-mono text-xs">
                          {payment.transactionId || "—"}
                        </td>
                        <td className="px-4 py-3.5 font-serif text-base text-brand">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          {statusBadge(payment.status)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {format(new Date(payment.createdAt), "dd MMM yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </FilteredList>
      </CardContent>
    </Card>
  );
}

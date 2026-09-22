import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { formatCurrency } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { PrintInvoiceButton } from "@/components/orders/print-invoice-button";

export const metadata: Metadata = {
  title: "Payout Advice | Seller",
};

export default async function SellerPayoutAdvicePage({
  params,
}: {
  params: Promise<{ payoutId: string }>;
}) {
  const { payoutId } = await params;
  const acting = await getActingSeller();
  if (!acting) notFound();

  const payout = await prisma.sellerPayout.findFirst({
    where: {
      id: payoutId,
      sellerId: acting.sellerUserId,
    },
    include: {
      seller: {
        select: {
          businessName: true,
          businessEmail: true,
          bankName: true,
          bankAccountNumber: true,
          bankIfscCode: true,
          bankAccountHolder: true,
        },
      },
      earnings: {
        select: {
          orderNumber: true,
          productName: true,
          netAmount: true,
          grossAmount: true,
          commissionAmount: true,
        },
        take: 100,
      },
      _count: { select: { earnings: true } },
    },
  });

  if (!payout) notFound();

  return (
    <div className="bg-white print:bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/seller/payments"
            className="text-sm text-[#8b2e2e] hover:underline"
          >
            ← Back to payments
          </Link>
          <PrintInvoiceButton orderNumber={payout.id.slice(-8).toUpperCase()} />
        </div>

        <div className="rounded-2xl border border-neutral-200 p-6 sm:p-8 print:rounded-none print:border-0 print:p-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <p className="font-serif text-2xl text-brand">{APP_NAME}</p>
              <p className="mt-1 text-sm font-semibold tracking-wide uppercase">
                Payout advice
              </p>
            </div>
            <div className="text-right text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">
                Advice #{payout.id.slice(-10).toUpperCase()}
              </p>
              <p>
                Date:{" "}
                {format(
                  new Date(payout.paidAt || payout.createdAt),
                  "dd MMM yyyy",
                )}
              </p>
              <p>Status: {payout.status}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 px-4 py-3 text-sm">
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Payee
              </p>
              <p className="mt-2 font-medium text-neutral-900">
                {payout.seller.businessName}
              </p>
              {payout.seller.businessEmail ? (
                <p className="text-neutral-600">{payout.seller.businessEmail}</p>
              ) : null}
              {payout.seller.bankAccountNumber ? (
                <p className="mt-2 text-neutral-600">
                  {payout.seller.bankAccountHolder || "Account"} ·{" "}
                  {payout.seller.bankName || "Bank"} · ****
                  {payout.seller.bankAccountNumber.slice(-4)}
                  {payout.seller.bankIfscCode
                    ? ` · ${payout.seller.bankIfscCode}`
                    : ""}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-neutral-200 px-4 py-3 text-sm">
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Settlement
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">Gross</span>
                  <span>{formatCurrency(Number(payout.gross))}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">Commission</span>
                  <span>-{formatCurrency(Number(payout.commission))}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-neutral-200 pt-1.5 font-semibold">
                  <span>Net paid</span>
                  <span>{formatCurrency(Number(payout.amount))}</span>
                </div>
                {payout.utr ? (
                  <p className="pt-1 text-neutral-600">
                    UTR: <span className="font-mono">{payout.utr}</span>
                  </p>
                ) : null}
                {payout.note ? (
                  <p className="text-neutral-600">Note: {payout.note}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-neutral-900">
              Included earnings ({payout._count.earnings})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-y border-neutral-200 bg-neutral-50 text-left text-neutral-500">
                    <th className="px-3 py-2 font-medium">Order</th>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {payout.earnings.map((row, index) => (
                    <tr
                      key={`${row.orderNumber}-${index}`}
                      className="border-b border-neutral-100"
                    >
                      <td className="px-3 py-2">{row.orderNumber}</td>
                      <td className="px-3 py-2">{row.productName}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(Number(row.netAmount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-8 text-[11px] leading-4 text-neutral-400">
            This advice confirms settlement of marketplace earnings after
            platform commission. Retain for your records. E. &amp; O.E.
          </p>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { getOrderById } from "@/actions/orders/get-orders";
import { getSiteSettings } from "@/lib/content/get-site-settings";
import { APP_NAME } from "@/lib/constants";
import prisma from "@/lib/prisma";
import {
  amountInWordsInr,
  buildInvoiceBreakdown,
  type InvoiceAddress,
} from "@/lib/orders/invoice-tax";
import {
  parseJewelleryBreakup,
} from "@/lib/orders/jewellery-breakup";
import {
  parseSellerBusinessAddress,
} from "@/lib/orders/seller-invoice";
import {
  getPaymentProviderLabel,
  getPaymentStatusLabel,
  paymentProviderFrom,
} from "@/lib/orders/order-utils";
import { DEFAULT_HSN } from "@/lib/tax/jewellery-gst";
import { formatCurrency } from "@/lib/utils";
import { PrintInvoiceButton } from "@/components/orders/print-invoice-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return { title: "Invoice" };
  }
  return {
    title: `Invoice ${order.orderNumber}`,
  };
}

function MoneyCell({
  value,
  hide,
  className = "",
}: {
  value: number;
  hide?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`py-2.5 px-1.5 text-right align-top tabular-nums ${className}`}
    >
      {hide ? "—" : formatCurrency(value)}
    </td>
  );
}

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, siteSettings] = await Promise.all([
    getOrderById(id),
    getSiteSettings(),
  ]);
  if (!order) notFound();

  const ship = order.shippingAddress as unknown as InvoiceAddress;
  const bill = (order.billingAddress ||
    order.shippingAddress) as unknown as InvoiceAddress;
  const provider = paymentProviderFrom(order.payments);
  const invoiceNumber = `INV-${order.orderNumber}`;
  const invoiceDate = format(new Date(order.createdAt), "dd-MM-yyyy");
  const hidePrices = Boolean(order.hidePriceOnInvoice);

  const sellerIds = [...new Set(order.items.map((item) => item.sellerId))];
  const sellers = await prisma.sellerProfile.findMany({
    where: { sellerId: { in: sellerIds } },
    select: {
      sellerId: true,
      businessName: true,
      gstNumber: true,
      panNumber: true,
      businessAddress: true,
      businessPhone: true,
      businessEmail: true,
    },
  });
  const sellerById = new Map(sellers.map((seller) => [seller.sellerId, seller]));
  const primarySeller = sellers[0] ?? null;
  const primaryAddress = parseSellerBusinessAddress(
    primarySeller?.businessAddress,
  );

  const breakdown = buildInvoiceBreakdown({
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      price: Number(item.price),
      discount: Number(item.discount),
      giftPackaging: item.giftPackaging,
      taxField: Number(item.tax),
    })),
    orderDiscount: Number(order.discount),
    orderTax: Number(order.tax),
    shippingFee: Number(order.shippingFee),
    giftPackagingFee: Number(order.giftPackagingFee ?? 0),
    orderTotal: Number(order.total),
    shipState: ship.state,
    // CGST/SGST vs IGST from seller ship-from state (profile), not platform env
    sellerState: primaryAddress.state || ship.state,
  });

  const halfRate = roundDisplay(breakdown.taxRate / 2);

  return (
    <div className="bg-white print:bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/orders/${order.id}`}
            className="text-sm text-[#8b2e2e] hover:underline"
          >
            ← Back to order
          </Link>
          <PrintInvoiceButton orderNumber={order.orderNumber} />
        </div>

        <div className="print-invoice-sheet box-border rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 print:rounded-none print:border-0 print:p-0">
          {hidePrices ? (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 print:border print:bg-white">
              Gift invoice — prices are hidden on this copy.
            </p>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
            <div className="min-w-0">
              <Image
                src="/brand/vidyora-invoice-logo.png"
                alt="VIDYORA"
                width={280}
                height={79}
                unoptimized
                className="h-11 w-auto object-contain object-left sm:h-12"
                priority
              />
              <p className="mt-2 text-sm font-semibold tracking-wide text-neutral-900 uppercase">
                Tax Invoice
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Marketplace: {APP_NAME}
              </p>
            </div>
            <div className="max-w-xs text-right text-xs leading-5 text-neutral-600 sm:text-sm">
              <p className="font-medium text-neutral-900">
                Invoice Number # {invoiceNumber}
              </p>
              <p>Order ID: {order.orderNumber}</p>
              <p>Order Date: {invoiceDate}</p>
              <p>Invoice Date: {invoiceDate}</p>
              {primarySeller?.panNumber ? (
                <p>PAN: {primarySeller.panNumber}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {sellerIds.map((sellerId) => {
              const seller = sellerById.get(sellerId);
              if (!seller) {
                return (
                  <div
                    key={sellerId}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-xs text-neutral-500"
                  >
                    Sold By details unavailable for one seller on this order.
                  </div>
                );
              }
              const address = parseSellerBusinessAddress(seller.businessAddress);
              const addressLines = [
                address.addressLine1,
                address.addressLine2,
                [address.city, address.state, address.postalCode]
                  .filter(Boolean)
                  .join(", "),
              ].filter(Boolean);

              return (
                <div
                  key={sellerId}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-xs leading-5 text-neutral-700 sm:text-sm"
                >
                  <p>
                    <span className="font-semibold text-neutral-900">
                      Sold By:
                    </span>{" "}
                    {seller.businessName}
                  </p>
                  {addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  {seller.gstNumber ? (
                    <p className="mt-1 font-medium">
                      GSTIN — {seller.gstNumber}
                    </p>
                  ) : (
                    <p className="mt-1 text-neutral-500">
                      GSTIN — update in seller Profile &amp; KYC
                    </p>
                  )}
                  {seller.panNumber ? <p>PAN — {seller.panNumber}</p> : null}
                  {(seller.businessEmail || seller.businessPhone) && (
                    <p className="mt-1 text-neutral-500">
                      {[seller.businessEmail, seller.businessPhone]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-neutral-500">
            Platform support: {siteSettings.contact.supportEmail} ·{" "}
            {siteSettings.contact.supportPhone} · Payment:{" "}
            {getPaymentStatusLabel(order.paymentStatus, provider)} ·{" "}
            {getPaymentProviderLabel(provider)}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <AddressBlock title="Ship To" address={ship} />
            <AddressBlock title="Bill To" address={bill} />
          </div>

          {order.occasionNote || order.giftMessage ? (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-xs leading-5 text-neutral-700 sm:text-sm">
              {order.occasionNote ? (
                <p>
                  <span className="font-semibold text-neutral-900">
                    Occasion:
                  </span>{" "}
                  {order.occasionNote}
                </p>
              ) : null}
              {order.giftMessage ? (
                <p className={order.occasionNote ? "mt-1.5" : undefined}>
                  <span className="font-semibold text-neutral-900">
                    Gift message:
                  </span>{" "}
                  <span className="whitespace-pre-line">{order.giftMessage}</span>
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-5 text-xs text-neutral-500">
            Total items: {order.items.length}
          </p>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[11px] sm:text-xs">
              <thead>
                <tr className="border-y border-neutral-300 bg-neutral-50 text-neutral-600">
                  <th className="py-2.5 pr-2 pl-1 text-left font-semibold">
                    Product
                  </th>
                  <th className="py-2.5 px-1 text-center font-semibold">Qty</th>
                  <th className="py-2.5 px-1 text-right font-semibold">Gross</th>
                  <th className="py-2.5 px-1 text-right font-semibold">
                    Discount
                  </th>
                  <th className="py-2.5 px-1 text-right font-semibold">
                    Taxable
                  </th>
                  {breakdown.mode === "igst" ? (
                    <th className="py-2.5 px-1 text-right font-semibold">
                      IGST
                      {breakdown.taxRate > 0
                        ? ` (${roundDisplay(breakdown.taxRate)}%)`
                        : ""}
                    </th>
                  ) : (
                    <>
                      <th className="py-2.5 px-1 text-right font-semibold">
                        CGST
                        {breakdown.taxRate > 0 ? ` (${halfRate}%)` : ""}
                      </th>
                      <th className="py-2.5 px-1 text-right font-semibold">
                        SGST
                        {breakdown.taxRate > 0 ? ` (${halfRate}%)` : ""}
                      </th>
                    </>
                  )}
                  <th className="py-2.5 pl-1 pr-1 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.lines.map((line) => {
                  const orderItem = order.items.find(
                    (item) => item.id === line.id,
                  );
                  const hsn = orderItem?.hsn || DEFAULT_HSN;
                  const lineSeller = orderItem
                    ? sellerById.get(orderItem.sellerId)
                    : null;
                  return (
                    <tr key={line.id} className="border-b border-neutral-100">
                      <td className="py-2.5 pr-2 pl-1 align-top">
                        <p className="font-medium text-neutral-900">
                          {line.title}
                        </p>
                        <p className="mt-0.5 break-words text-[10px] leading-4 text-neutral-500 sm:text-[11px]">
                          {line.meta}
                          {line.id !== "shipping" &&
                          line.id !== "gift-packaging"
                            ? ` · HSN ${hsn}`
                            : ""}
                          {orderItem?.certificateNumber
                            ? ` · Cert. ${orderItem.certificateNumber}`
                            : ""}
                          {lineSeller
                            ? ` · Seller: ${lineSeller.businessName}`
                            : ""}
                          {line.taxRate > 0
                            ? ` · GST ${roundDisplay(line.taxRate)}%`
                            : ""}
                        </p>
                        {!hidePrices &&
                        orderItem &&
                        (() => {
                          const jb = parseJewelleryBreakup(
                            orderItem.jewelleryBreakup,
                          );
                          if (!jb) return null;
                          return (
                            <p className="mt-1 text-[10px] leading-4 text-neutral-500 sm:text-[11px]">
                              {jb.metalLabel}: {formatCurrency(jb.metalValue)}
                              {jb.weightGrams > 0
                                ? ` (${jb.weightGrams}g)`
                                : ""}
                              {" · "}Making: {formatCurrency(jb.making)}
                              {" · "}GST ({jb.gstRate}%):{" "}
                              {formatCurrency(jb.gst)}
                            </p>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-1 text-center align-top tabular-nums">
                        {line.quantity}
                      </td>
                      <MoneyCell value={line.gross} hide={hidePrices} />
                      <MoneyCell value={line.discount} hide={hidePrices} />
                      <MoneyCell value={line.taxable} hide={hidePrices} />
                      {breakdown.mode === "igst" ? (
                        <MoneyCell value={line.igst} hide={hidePrices} />
                      ) : (
                        <>
                          <MoneyCell value={line.cgst} hide={hidePrices} />
                          <MoneyCell value={line.sgst} hide={hidePrices} />
                        </>
                      )}
                      <MoneyCell
                        value={line.total}
                        hide={hidePrices}
                        className="font-medium text-neutral-900"
                      />
                    </tr>
                  );
                })}
                <tr className="border-b border-neutral-300 bg-neutral-50 font-semibold text-neutral-900">
                  <td className="py-2.5 pr-2 pl-1">Total</td>
                  <td className="py-2.5 px-1 text-center tabular-nums">
                    {breakdown.totals.quantity}
                  </td>
                  <MoneyCell value={breakdown.totals.gross} hide={hidePrices} />
                  <MoneyCell
                    value={breakdown.totals.discount}
                    hide={hidePrices}
                  />
                  <MoneyCell
                    value={breakdown.totals.taxable}
                    hide={hidePrices}
                  />
                  {breakdown.mode === "igst" ? (
                    <MoneyCell
                      value={breakdown.totals.igst}
                      hide={hidePrices}
                    />
                  ) : (
                    <>
                      <MoneyCell
                        value={breakdown.totals.cgst}
                        hide={hidePrices}
                      />
                      <MoneyCell
                        value={breakdown.totals.sgst}
                        hide={hidePrices}
                      />
                    </>
                  )}
                  <MoneyCell value={breakdown.totals.total} hide={hidePrices} />
                </tr>
              </tbody>
            </table>
          </div>

          {!hidePrices ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 px-4 py-3 text-xs leading-5 text-neutral-600">
                <p className="font-semibold text-neutral-900">Tax summary</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between gap-4">
                    <span>Taxable value</span>
                    <span className="tabular-nums">
                      {formatCurrency(breakdown.totals.taxable)}
                    </span>
                  </div>
                  {breakdown.mode === "igst" ? (
                    <div className="flex justify-between gap-4">
                      <span>IGST ({roundDisplay(breakdown.taxRate)}%)</span>
                      <span className="tabular-nums">
                        {formatCurrency(breakdown.totals.igst)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between gap-4">
                        <span>CGST ({halfRate}%)</span>
                        <span className="tabular-nums">
                          {formatCurrency(breakdown.totals.cgst)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>SGST ({halfRate}%)</span>
                        <span className="tabular-nums">
                          {formatCurrency(breakdown.totals.sgst)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between gap-4 border-t border-neutral-200 pt-1.5 font-medium text-neutral-900">
                    <span>Total tax</span>
                    <span className="tabular-nums">
                      {formatCurrency(Number(order.tax))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Grand Total</span>
                  <span className="text-lg font-semibold tabular-nums text-neutral-900">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-neutral-500">
                  Amount in words:{" "}
                  <span className="font-medium text-neutral-700">
                    {amountInWordsInr(Number(order.total))}
                  </span>
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-neutral-200 pt-5">
            <p className="max-w-md text-[11px] leading-4 text-neutral-400">
              Keep this invoice with your jewellery box and certificates for
              warranty, returns and insurance. Sold-by details come from the
              seller&apos;s VIDYORA profile. E. &amp; O.E.
            </p>
            <div className="min-w-[160px] text-right">
              <p className="text-xs font-medium text-neutral-900">
                {primarySeller?.businessName || APP_NAME}
              </p>
              <div className="mt-8 border-t border-neutral-300 pt-1 text-[11px] text-neutral-500">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressBlock({
  title,
  address,
}: {
  title: string;
  address: InvoiceAddress;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-neutral-200 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
        {title}
      </p>
      <p className="mt-2 text-sm font-medium text-neutral-900">
        {address.name}
      </p>
      <p className="break-words text-xs leading-5 text-neutral-600">
        {address.addressLine1}
      </p>
      {address.addressLine2 ? (
        <p className="break-words text-xs leading-5 text-neutral-600">
          {address.addressLine2}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-neutral-600">
        {[address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(", ")}
      </p>
      {address.phone ? (
        <p className="mt-1 text-xs text-neutral-600">Phone: {address.phone}</p>
      ) : null}
    </div>
  );
}

function roundDisplay(n: number) {
  return Math.round(n * 100) / 100;
}

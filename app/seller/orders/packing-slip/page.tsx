import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPackingSlipData } from "@/actions/seller/bulk-fulfillment";
import { format } from "date-fns";
import { PrintPackingSlipsButton } from "@/components/seller/print-packing-slips-button";

export const metadata: Metadata = {
  title: "Packing Slips | Seller",
};

export default async function PackingSlipPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const ids = (params.ids || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    notFound();
  }

  const slips = await getPackingSlipData(ids);
  if (slips.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl bg-white px-4 py-6 text-neutral-900">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Packing slips</h1>
          <p className="text-sm text-muted-foreground">
            {slips.length} slip(s) ready to print
          </p>
        </div>
        <PrintPackingSlipsButton />
      </div>

      <div className="space-y-8">
        {slips.map((slip, index) => {
          const addr = slip.shippingAddress || {};
          const line1 = [addr.line1, addr.addressLine1, addr.street]
            .filter(Boolean)
            .join(", ");
          const line2 = [addr.line2, addr.addressLine2].filter(Boolean).join(", ");
          const cityLine = [
            addr.city,
            addr.state,
            addr.postalCode || addr.pincode || addr.zip,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <section
              key={slip.id}
              className="break-after-page rounded-xl border border-neutral-300 p-6 print:break-after-page print:rounded-none print:border-black"
            >
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    VIDYORA packing slip
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {slip.orderNumber}
                  </h2>
                  <p className="text-sm text-neutral-600">
                    {format(new Date(slip.createdAt), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
                <p className="text-sm text-neutral-500">
                  {index + 1} / {slips.length}
                </p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-500">
                    Ship to
                  </p>
                  <p className="mt-1 font-medium">
                    {addr.name || slip.customerName || "Customer"}
                  </p>
                  <p className="text-sm text-neutral-700">{line1}</p>
                  {line2 ? (
                    <p className="text-sm text-neutral-700">{line2}</p>
                  ) : null}
                  <p className="text-sm text-neutral-700">{cityLine}</p>
                  {(addr.phone || slip.customerPhone) && (
                    <p className="mt-1 text-sm">
                      Phone: {addr.phone || slip.customerPhone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-500">
                    Item
                  </p>
                  <p className="mt-1 font-medium">{slip.productName}</p>
                  <p className="text-sm text-neutral-700">SKU: {slip.sku}</p>
                  <p className="text-sm text-neutral-700">
                    Qty: {slip.quantity}
                  </p>
                  {slip.giftMessage ? (
                    <p className="mt-2 rounded bg-neutral-50 p-2 text-sm italic">
                      Gift note: {slip.giftMessage}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-dashed border-neutral-300 pt-4 text-sm">
                <div>
                  <p className="text-neutral-500">Packed by</p>
                  <div className="mt-6 border-b border-neutral-400" />
                </div>
                <div>
                  <p className="text-neutral-500">Checked by</p>
                  <div className="mt-6 border-b border-neutral-400" />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

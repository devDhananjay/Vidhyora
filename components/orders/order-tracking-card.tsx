import Link from "next/link";
import { ExternalLink, Package } from "lucide-react";
import { resolveTrackingUrl } from "@/lib/shipping/courier-tracking";
import { format } from "date-fns";

type ShipmentLite = {
  id: string;
  courier: string | null;
  trackingNumber: string | null;
  shippedAt: Date | string | null;
  deliveredAt: Date | string | null;
};

export function OrderTrackingCard({
  shipments,
}: {
  shipments: ShipmentLite[];
}) {
  const active = shipments.filter(
    (shipment) => shipment.trackingNumber || shipment.courier,
  );

  if (active.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Package className="size-5 text-[#8b2e2e]" strokeWidth={1.6} />
        <h3 className="font-semibold">Shipment tracking</h3>
      </div>
      <div className="space-y-4">
        {active.map((shipment) => {
          const url = resolveTrackingUrl(
            shipment.courier,
            shipment.trackingNumber,
          );
          return (
            <div
              key={shipment.id}
              className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 text-sm"
            >
              {shipment.courier ? (
                <p>
                  <span className="text-muted-foreground">Courier: </span>
                  <span className="font-medium">{shipment.courier}</span>
                </p>
              ) : null}
              {shipment.trackingNumber ? (
                <p className="mt-1">
                  <span className="text-muted-foreground">Tracking #: </span>
                  <span className="font-mono font-medium">
                    {shipment.trackingNumber}
                  </span>
                </p>
              ) : null}
              {shipment.shippedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Shipped{" "}
                  {format(new Date(shipment.shippedAt), "dd MMM yyyy")}
                </p>
              ) : null}
              {url ? (
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-[#8b2e2e] hover:underline"
                >
                  Track package
                  <ExternalLink className="size-3.5" />
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

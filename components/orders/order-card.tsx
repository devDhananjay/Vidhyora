import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel, getOrderStatusColor, paymentProviderFrom } from "@/lib/orders/order-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import type { OrderWithDetails } from "@/types/order";
import { format } from "date-fns";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";

type OrderCardProps = {
  order: OrderWithDetails;
};

export function OrderCard({ order }: OrderCardProps) {
  const statusColor = getOrderStatusColor(order.orderStatus);
  const firstItem = order.items[0];

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-lg border p-4 transition-colors hover:border-primary sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-semibold">Order #{order.orderNumber}</span>
            <Badge className={`bg-${statusColor}-100 text-${statusColor}-700`}>
              {getOrderStatusLabel(order.orderStatus)}
            </Badge>
            <PaymentStatusBadge
              status={order.paymentStatus}
              provider={paymentProviderFrom(order.payments)}
            />
          </div>

          <div className="mb-4 text-sm text-muted-foreground">
            Placed on {format(new Date(order.createdAt), "MMM dd, yyyy")}
          </div>

          <div className="flex items-start gap-3 sm:gap-4">
            {firstItem && (
              <div className="relative size-16 shrink-0 overflow-hidden rounded sm:size-20">
                {firstItem.product.thumbnail ? (
                  <Image
                    src={firstItem.product.thumbnail}
                    alt={firstItem.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted text-3xl">
                    📦
                  </div>
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 font-medium">{firstItem?.productName}</div>
              {order.items.length > 1 && (
                <div className="mt-1 text-sm text-muted-foreground">
                  +{order.items.length - 1} more item(s)
                </div>
              )}
              <div className="mt-2 text-sm font-semibold">
                Total: {formatCurrency(Number(order.total))}
              </div>
            </div>
          </div>
        </div>

        <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}

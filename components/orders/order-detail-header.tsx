import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getOrderStatusLabel, getOrderStatusColor } from "@/lib/orders/order-utils";
import type { OrderWithDetails } from "@/types/order";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type OrderDetailHeaderProps = {
  order: OrderWithDetails;
};

export function OrderDetailHeader({ order }: OrderDetailHeaderProps) {
  const statusColor = getOrderStatusColor(order.orderStatus);

  return (
    <div>
      <Link href="/orders">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 size-4" />
          Back to Orders
        </Button>
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-muted-foreground">
            Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
          </p>
        </div>

        <Badge className={`bg-${statusColor}-100 text-${statusColor}-700 text-base px-4 py-2`}>
          {getOrderStatusLabel(order.orderStatus)}
        </Badge>
      </div>
    </div>
  );
}

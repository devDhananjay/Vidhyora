import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";

type RecentOrder = {
  id: string;
  quantity: number;
  price: any;
  total: any;
  order: {
    id: string;
    orderNumber: string;
    orderStatus: string;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
    };
  };
  product: {
    name: string;
    thumbnail: string | null;
    slug: string;
  };
  variant: {
    sku: string;
  };
};

type RecentOrdersTableProps = {
  orders: RecentOrder[];
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            No orders yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Link
          href="/seller/orders"
          className="text-sm text-primary hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((item) => {
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded sm:size-16">
                    {item.product.thumbnail ? (
                      <Image
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/seller/orders/${item.id}`}
                      className="line-clamp-2 font-medium hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      <span>Order: {item.order.orderNumber}</span>
                      <span>•</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(item.order.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start sm:text-right">
                  <div className="font-semibold">
                    {formatCurrency(Number(item.total))}
                  </div>
                  <Badge variant="outline" className="mt-0 sm:mt-1">
                    {getOrderStatusLabel(item.order.orderStatus)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

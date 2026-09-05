import type { Metadata } from "next";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Star,
  Store,
} from "lucide-react";
import { getAdminAnalytics } from "@/actions/admin/get-analytics";
import { StatCard } from "@/components/seller/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Analytics | Super Admin",
};

export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalytics();
  const { stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Platform performance across orders, payments, sellers and catalogue.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description={`${formatCurrency(stats.todayRevenue)} today`}
        />
        <StatCard
          title="Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          description={`${stats.pendingOrders} in progress`}
        />
        <StatCard
          title="Users"
          value={stats.totalUsers}
          icon={Users}
          description={`${stats.totalCustomers} customers`}
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
          description={`${stats.pendingProducts} pending approval`}
        />
        <StatCard
          title="Sellers"
          value={stats.totalSellers}
          icon={Store}
          description={`${stats.pendingSellers} pending verification`}
        />
        <StatCard
          title="Reviews"
          value={stats.pendingReviews}
          icon={Star}
          description={`${stats.activeCoupons} active coupons`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.ordersByStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No order data yet.
              </p>
            ) : (
              data.ordersByStatus.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <span>{getOrderStatusLabel(row.status)}</span>
                  <Badge variant="outline">{row.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.paymentsByStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No payment data yet.
              </p>
            ) : (
              data.paymentsByStatus.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <span>{row.status}</span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(row.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.count} payments
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No product sales yet.
              </p>
            ) : (
              data.topProducts.map((product) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.quantity} sold
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between border-b pb-3 last:border-0 hover:text-primary"
                >
                  <div>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.userName} •{" "}
                      {format(new Date(order.createdAt), "MMM dd")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(order.total)}
                    </div>
                    <Badge variant="outline">
                      {getOrderStatusLabel(order.orderStatus)}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

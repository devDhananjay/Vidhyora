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
import { exportAdminAnalyticsCsv } from "@/actions/admin/export-analytics-csv";
import { ExportAnalyticsButton } from "@/components/shared/export-analytics-button";
import { getIntegrationsSettings } from "@/lib/content/integrations-settings";
import { StatCard } from "@/components/seller/stat-card";
import { HorizontalBarChart } from "@/components/shared/horizontal-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Analytics | Admin",
};

export default async function AdminAnalyticsPage() {
  const [data, integrations] = await Promise.all([
    getAdminAnalytics(),
    getIntegrationsSettings(),
  ]);
  const { stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-brand sm:text-4xl">Analytics</h1>
          <p className="mt-2 text-muted-foreground">
            Platform performance across orders, payments, sellers and catalogue.
          </p>
        </div>
        {integrations.analyticsExportEnabled ? (
          <ExportAnalyticsButton exportAction={exportAdminAnalyticsCsv} />
        ) : null}
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
          description="Awaiting moderation"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <HorizontalBarChart
              items={data.ordersByStatus.map((row) => ({
                label: getOrderStatusLabel(row.status),
                value: row.count,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <HorizontalBarChart
              items={data.paymentsByStatus.map((row) => ({
                label: row.status,
                value: row.amount,
                display: `${formatCurrency(row.amount)} · ${row.count}`,
              }))}
              accent="#5c1f1f"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <HorizontalBarChart
              items={data.topProducts.map((product) => ({
                label: product.name,
                value: product.revenue,
                display: formatCurrency(product.revenue),
              }))}
            />
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

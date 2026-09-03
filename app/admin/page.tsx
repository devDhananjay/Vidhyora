import type { Metadata } from "next";
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Star
} from "lucide-react";
import { getAdminStats, getRecentActivity } from "@/actions/admin/get-admin-stats";
import { StatCard } from "@/components/seller/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Super Admin | VIDYORA",
  description: "Monitor seller admins and moderate the marketplace",
};

export default async function AdminDashboardPage() {
  const [stats, activity] = await Promise.all([
    getAdminStats(),
    getRecentActivity(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Super Admin</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Monitor seller admins, approve or reject listings and reviews, and
          activate or deactivate accounts.
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description="All-time platform revenue"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon={TrendingUp}
          description="Revenue generated today"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          description={`${stats.pendingOrders} pending`}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description={`${stats.totalCustomers} customers, ${stats.totalSellers} seller admins`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/products">
          <StatCard
            title="Products"
            value={stats.totalProducts}
            icon={Package}
            description={`${stats.pendingProducts} pending approval`}
          />
        </Link>
        <Link href="/admin/sellers">
          <StatCard
            title="Seller Admins"
            value={stats.totalSellers}
            icon={Store}
            description={`${stats.pendingSellers} pending approval`}
          />
        </Link>
        <Link href="/admin/reviews">
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            icon={Star}
            description="Reviews awaiting moderation"
          />
        </Link>
        <Link href="/admin/coupons">
          <StatCard
            title="Active Coupons"
            value={stats.activeCoupons}
            icon={AlertCircle}
            description="Currently active discount coupons"
          />
        </Link>
      </div>

      {/* Pending Actions Alert */}
      {(stats.pendingProducts > 0 || stats.pendingSellers > 0 || stats.pendingReviews > 0) && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-orange-600" />
              <CardTitle className="text-orange-900">Pending Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {stats.pendingSellers > 0 && (
                <Link href="/admin/sellers">
                  <div className="rounded-lg border bg-background p-4 hover:bg-muted">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.pendingSellers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Seller admin{stats.pendingSellers === 1 ? "" : "s"} awaiting approval
                    </div>
                  </div>
                </Link>
              )}
              {stats.pendingProducts > 0 && (
                <Link href="/admin/products">
                  <div className="rounded-lg border bg-background p-4 hover:bg-muted">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.pendingProducts}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Product{stats.pendingProducts === 1 ? "" : "s"} pending approval
                    </div>
                  </div>
                </Link>
              )}
              {stats.pendingReviews > 0 && (
                <Link href="/admin/reviews">
                  <div className="rounded-lg border bg-background p-4 hover:bg-muted">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.pendingReviews}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Review{stats.pendingReviews === 1 ? "" : "s"} to moderate
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {activity.recentOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No orders yet
              </div>
            ) : (
              <div className="space-y-4">
                {activity.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="font-medium">Order #{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.user.name} • {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(Number(order.total))}</div>
                      <Badge variant="outline" className="mt-1">
                        {order.orderStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Users</CardTitle>
            <Link href="/admin/users" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {activity.recentUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No users yet
              </div>
            ) : (
              <div className="space-y-4">
                {activity.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{user.role}</Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM dd")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

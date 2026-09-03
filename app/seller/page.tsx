import type { Metadata } from "next";
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { getSellerStats, getRecentOrders, getLowStockProducts } from "@/actions/seller/get-seller-stats";
import { StatCard } from "@/components/seller/stat-card";
import { RecentOrdersTable } from "@/components/seller/recent-orders-table";
import { LowStockAlert } from "@/components/seller/low-stock-alert";
import { formatCurrency } from "@/lib/utils";
import { getActingSeller } from "@/lib/seller-context";

export const metadata: Metadata = {
  title: "Seller Admin | VIDYORA",
  description: "Manage your products, orders, and sales",
};

export default async function SellerDashboardPage() {
  const acting = await getActingSeller();

  const [stats, recentOrders, lowStockProducts] = await Promise.all([
    getSellerStats(),
    getRecentOrders(5),
    getLowStockProducts(5),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">
          {acting?.isAdminView ? "Seller Admin Review" : "Seller Admin"}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {acting?.isAdminView
            ? `Monitoring ${acting.businessName}. Super Admin can approve, reject, or deactivate from the Super Admin panel.`
            : "Manage your own products, inventory, and orders. Listings go live after Super Admin approval."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description="All-time earnings"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.thisMonthRevenue)}
          icon={TrendingUp}
          description="Revenue this month"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          description={`${stats.pendingOrders} pending`}
        />
        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          icon={Package}
          description={`${stats.totalProducts} total products`}
        />
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          icon={AlertCircle}
          description="Products awaiting admin approval"
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          icon={CheckCircle}
          description="Successfully delivered"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockProducts}
          icon={AlertCircle}
          description="Products with low inventory"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <LowStockAlert products={lowStockProducts} />
      )}

      {/* Recent Orders */}
      <RecentOrdersTable orders={recentOrders} />
    </div>
  );
}

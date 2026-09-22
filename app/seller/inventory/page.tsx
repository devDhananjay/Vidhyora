import type { Metadata } from "next";
import Link from "next/link";
import { getSellerInventory } from "@/actions/seller/manage-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/seller/inventory-table";
import { StatCard } from "@/components/seller/stat-card";
import { AlertTriangle, Package, PackageX } from "lucide-react";

export const metadata: Metadata = {
  title: "Inventory | Seller Dashboard",
};

export default async function SellerInventoryPage() {
  const inventory = await getSellerInventory();

  const lowStockProducts = inventory.filter((p) => p.isLowStock);
  const outOfStockProducts = inventory.filter((p) => p.availableStock === 0);
  const totalStock = inventory.reduce((sum, p) => sum + p.totalStock, 0);
  const totalAvailable = inventory.reduce((sum, p) => sum + p.availableStock, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Inventory Management
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Track and manage your product stock levels
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={inventory.length}
          icon={Package}
        />
        <StatCard
          title="Total Stock"
          value={totalStock}
          icon={Package}
          description={`${totalAvailable} available`}
        />
        <StatCard
          title="Low Stock"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          description="Products below 10 units"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockProducts.length}
          icon={PackageX}
          description="Products with 0 stock"
        />
      </div>

      {lowStockProducts.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-500" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                Low Stock Alert
              </h4>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                {lowStockProducts.length}{" "}
                {lowStockProducts.length === 1 ? "product has" : "products have"}{" "}
                low stock levels. Consider restocking soon.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 font-serif text-2xl text-brand">No products yet</h3>
              <p className="mb-4 text-muted-foreground">
                Start by adding your first product
              </p>
              <Link href="/seller/products/new">
                <Button>Add Product</Button>
              </Link>
            </div>
          ) : (
            <InventoryTable inventory={inventory} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

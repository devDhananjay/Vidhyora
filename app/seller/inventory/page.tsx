import type { Metadata } from "next";
import Link from "next/link";
import { getSellerInventory } from "@/actions/seller/manage-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/seller/inventory-table";
import { AlertTriangle, Package } from "lucide-react";

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
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Inventory Management</h1>
        <p className="mt-2 text-muted-foreground">
          Track and manage your product stock levels
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">
              {totalAvailable} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="size-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Products below 10 units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {outOfStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Products with 0 stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-500" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                Low Stock Alert
              </h4>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                {lowStockProducts.length} {lowStockProducts.length === 1 ? "product has" : "products have"} low stock levels. Consider restocking soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No products yet</h3>
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

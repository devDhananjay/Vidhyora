import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAdminInventory } from "@/actions/admin/manage-inventory";
import {
  getLowStockVariants,
} from "@/actions/admin/get-low-stock";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/inventory/low-stock";
import { AdminStockEditor } from "@/components/admin/admin-stock-editor";
import { NotifyLowStockButton } from "@/components/admin/notify-low-stock-button";
import { ProductActions } from "@/components/admin/product-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inventory override | Admin",
};

export default async function AdminInventoryPage() {
  const [inventory, lowStockRows] = await Promise.all([
    getAdminInventory(),
    getLowStockVariants(DEFAULT_LOW_STOCK_THRESHOLD),
  ]);
  const lowStock = inventory.filter((row) => row.isLowStock).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Inventory override
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and adjust stock across seller admins without taking over their
          daily inventory screen. {inventory.length} listings • {lowStock} low
          stock. Suspend still lives on the product.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-serif text-xl">
              Low stock (≤ {DEFAULT_LOW_STOCK_THRESHOLD})
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Approved products with variant stock at or below{" "}
              {DEFAULT_LOW_STOCK_THRESHOLD} units.
            </p>
          </div>
          <NotifyLowStockButton threshold={DEFAULT_LOW_STOCK_THRESHOLD} />
        </CardHeader>
        <CardContent>
          {lowStockRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No variants at or below the threshold.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Product</th>
                    <th className="pb-2 pr-3 font-medium">SKU</th>
                    <th className="pb-2 pr-3 font-medium">Stock</th>
                    <th className="pb-2 pr-3 font-medium">Seller</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {lowStockRows.map((row) => (
                    <tr key={row.variantId} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium">
                        {row.productName}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {row.sku}
                      </td>
                      <td className="py-3 pr-3 text-red-600 font-semibold">
                        {row.stock}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {row.sellerName}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/admin/products/${row.productId}`}
                          className="text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {inventory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No products to override yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inventory.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {product.sellerName} • {product.categoryName} •{" "}
                          {product.availableStock} available
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{product.status}</Badge>
                        <Badge
                          className={
                            product.approvalStatus === "APPROVED"
                              ? "bg-green-600"
                              : product.approvalStatus === "SUSPENDED"
                                ? "bg-red-600"
                                : "bg-yellow-600"
                          }
                        >
                          {product.approvalStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
                        >
                          <div className="text-sm">
                            <div className="font-medium">{variant.sku}</div>
                            <div className="text-muted-foreground">
                              {variant.reservedStock} reserved
                            </div>
                          </div>
                          <AdminStockEditor
                            variantId={variant.id}
                            stock={variant.stock}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <ProductActions
                        productId={product.id}
                        currentStatus={product.approvalStatus}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type LowStockProduct = {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  variants: Array<{
    id: string;
    sku: string;
    stock: number;
  }>;
};

type LowStockAlertProps = {
  products: LowStockProduct[];
};

export function LowStockAlert({ products }: LowStockAlertProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 shrink-0 text-orange-600" />
          <CardTitle className="text-orange-900">Low Stock Alert</CardTitle>
        </div>
        <Link
          href="/seller/inventory"
          className="text-sm text-primary hover:underline"
        >
          Manage Inventory
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product) => {
            const lowestVariant = product.variants[0];
            return (
              <div
                key={product.id}
                className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted text-2xl">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/seller/products/${product.id}`}
                      className="line-clamp-2 font-medium hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-1 text-sm text-muted-foreground">
                      SKU: {lowestVariant.sku}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <Badge variant="destructive" className="font-semibold">
                    {lowestVariant.stock} left
                  </Badge>
                  <Link href={`/seller/products/${product.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Update Stock
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

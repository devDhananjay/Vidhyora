import type { Metadata } from "next";
import { getAllProducts } from "@/actions/admin/manage-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/admin/product-actions";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Products | Super Admin",
};

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "PENDING_APPROVAL":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const pendingCount = products.filter(
    (p) => p.approvalStatus === "PENDING_APPROVAL",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Product Review</h1>
        <p className="mt-2 text-muted-foreground">
          {products.length} total products • {pendingCount} pending Super Admin
          approval
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No products found
            </CardContent>
          </Card>
        ) : (
          products.map((product) => {
            const totalStock = product.variants.reduce(
              (acc, v) => acc + v.stock,
              0,
            );
            const minPrice = product.variants.length
              ? Math.min(...product.variants.map((v) => Number(v.price)))
              : Number(product.basePrice);

            return (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative size-24 shrink-0 overflow-hidden rounded">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted text-3xl">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-lg font-semibold hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{product.category.name}</span>
                            <span>•</span>
                            <span>{product.brand}</span>
                            <span>•</span>
                            <span>Seller: {product.seller.seller.name}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {getApprovalBadge(product.approvalStatus)}
                          <Badge
                            variant="outline"
                            className={
                              product.status === "ACTIVE"
                                ? "text-green-600"
                                : ""
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Price</div>
                          <div className="font-semibold">
                            {formatCurrency(minPrice)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Stock</div>
                          <div
                            className={`font-semibold ${
                              totalStock <= 10 ? "text-red-600" : ""
                            }`}
                          >
                            {totalStock} units
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Variants</div>
                          <div className="font-semibold">
                            {product.variants.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Submitted
                          </div>
                          <div className="font-semibold">
                            {format(new Date(product.createdAt), "MMM dd")}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Review Product →
                        </Link>
                        <Link
                          href="/admin/inventory"
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          Override stock
                        </Link>
                        <ProductActions
                          productId={product.id}
                          currentStatus={product.approvalStatus}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

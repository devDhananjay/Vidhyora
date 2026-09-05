import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerProducts } from "@/actions/seller/get-products";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Products | Seller Dashboard",
};

export default async function SellerProductsPage() {
  const products = await getSellerProducts();

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="outline" className="text-green-600">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">My Products</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {products.length} {products.length === 1 ? "product" : "products"}.
            Super Admin reviews new listings before they go live.
          </p>
        </div>
        <Link href="/seller/products/new" className="self-start">
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">📦</div>
            <h3 className="mb-2 text-lg font-semibold">No products yet</h3>
            <p className="mb-6 text-muted-foreground">
              Start by adding your first product to your store
            </p>
            <Link href="/seller/products/new">
              <Button>Add Your First Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => {
            const totalStock = product.variants.reduce(
              (acc, v) => acc + v.stock,
              0,
            );
            const minPrice = product.variants.length
              ? Math.min(...product.variants.map((v) => Number(v.price)))
              : Number(product.basePrice);

            return (
              <Card key={product.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Product Image */}
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-lg">
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
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/seller/products/${product.id}`}
                            className="text-lg font-semibold hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <span>{product.category.name}</span>
                            <span>•</span>
                            <span>Brand: {product.brand}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {getApprovalBadge(product.approvalStatus)}
                          {getStatusBadge(product.status)}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:gap-4">
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
                          <div className="text-muted-foreground">Orders</div>
                          <div className="font-semibold">
                            {product._count.orderItems}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Reviews</div>
                          <div className="font-semibold">
                            {product._count.reviews}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/products/${product.slug}`}>
                          <Button variant="outline" size="sm">
                            View on Store
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

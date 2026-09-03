import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProductById } from "@/actions/seller/get-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Product Details | Seller Dashboard",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl text-neutral-900">{product.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {product.category.name} • {product.brand}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/seller/products/${product.id}/edit`}>
            <Button>Edit Product</Button>
          </Link>
          <Link href={`/products/${product.slug}`}>
            <Button variant="outline">View on Store</Button>
          </Link>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Approval Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              className={
                product.approvalStatus === "APPROVED"
                  ? "bg-green-600"
                  : product.approvalStatus === "PENDING_APPROVAL"
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }
            >
              {product.approvalStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Product Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{product.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                totalStock <= 10 ? "text-red-600" : ""
              }`}
            >
              {totalStock} units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {product.thumbnail && (
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {product.images.slice(0, 3).map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-lg"
                >
                  <Image
                    src={image.url}
                    alt={image.altText || product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Variants ({product.variants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{variant.sku}</div>
                    <div className="text-sm text-muted-foreground">
                      Stock: {variant.stock} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(Number(variant.price))}
                    </div>
                    {variant.compareAtPrice && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatCurrency(Number(variant.compareAtPrice))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Product Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

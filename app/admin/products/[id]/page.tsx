import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAdminProductById } from "@/actions/admin/manage-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/admin/product-actions";
import { formatCurrency } from "@/lib/utils";
import { AdminStockEditor } from "@/components/admin/admin-stock-editor";

export const metadata: Metadata = {
  title: "Product Review | Super Admin",
};

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Products
        </Link>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-neutral-900">{product.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {product.category.name} • {product.brand}
            </p>
          </div>
          <ProductActions
            productId={product.id}
            currentStatus={product.approvalStatus}
          />
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
            {product.rejectionReason ? (
              <p className="mt-2 text-sm text-red-700">
                Reason: {product.rejectionReason}
              </p>
            ) : null}
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

      {/* Seller Information */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Seller Name</div>
              <div className="font-medium">{product.seller.seller.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Business Name
              </div>
              <div className="font-medium">{product.seller.businessName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{product.seller.seller.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Verification Status
              </div>
              <Badge
                className={
                  product.seller.verificationStatus === "APPROVED"
                    ? "bg-green-600"
                    : "bg-yellow-600"
                }
              >
                {product.seller.verificationStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{variant.sku}</div>
                    <div className="text-sm text-muted-foreground">
                      {variant.reservedStock} reserved
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-semibold">
                      {formatCurrency(Number(variant.price))}
                    </div>
                    <AdminStockEditor
                      variantId={variant.id}
                      stock={variant.stock}
                    />
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

      {/* Policy */}
      {product.policy && (
        <Card>
          <CardHeader>
            <CardTitle>Return & Warranty Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">
                  Return Allowed
                </div>
                <div className="font-medium">
                  {product.policy.returnAllowed ? "Yes" : "No"}
                </div>
              </div>
              {product.policy.returnAllowed && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Return Window
                  </div>
                  <div className="font-medium">
                    {product.policy.returnWindowDays} days
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">
                  Warranty Available
                </div>
                <div className="font-medium">
                  {product.policy.warrantyAvailable ? "Yes" : "No"}
                </div>
              </div>
              {product.policy.warrantyAvailable && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Warranty Period
                  </div>
                  <div className="font-medium">
                    {product.policy.warrantyMonths} months
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

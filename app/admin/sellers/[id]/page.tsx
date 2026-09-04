import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSellerById } from "@/actions/admin/manage-sellers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SellerActions } from "@/components/admin/seller-actions";
import { SellerCommissionForm } from "@/components/admin/seller-commission-form";
import { KycActions } from "@/components/admin/kyc-actions";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Seller Admin | Super Admin",
};

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getSellerById(id);

  if (!seller) {
    notFound();
  }

  const businessAddress = seller.businessAddress as Record<string, string>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/sellers" className="text-sm text-primary hover:underline">
          ← Back to Seller Admins
        </Link>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-neutral-900">{seller.businessName}</h1>
            <p className="mt-2 text-muted-foreground">{seller.seller.name}</p>
          </div>
          <SellerActions
            sellerId={seller.sellerId}
            currentStatus={seller.verificationStatus}
          />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              className={
                seller.verificationStatus === "APPROVED"
                  ? "bg-green-600"
                  : seller.verificationStatus === "PENDING"
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }
            >
              {seller.verificationStatus}
            </Badge>
            {seller.rejectionReason && (
              <p className="mt-2 text-sm text-destructive">
                Reason: {seller.rejectionReason}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KYC Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge
              variant="outline"
              className={
                seller.kycStatus === "VERIFIED"
                  ? "text-green-600"
                  : seller.kycStatus === "PENDING"
                    ? "text-yellow-600"
                    : seller.kycStatus === "REJECTED"
                      ? "text-red-600"
                      : ""
              }
            >
              {seller.kycStatus}
            </Badge>
            {seller.kycRejectionReason ? (
              <p className="text-sm text-destructive">
                {seller.kycRejectionReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seller.products.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Business Name</div>
              <div className="font-medium">{seller.businessName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Business Email</div>
              <div className="font-medium">{seller.businessEmail}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Business Phone</div>
              <div className="font-medium">{seller.businessPhone}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Commission Rate</div>
              <div className="font-medium">{Number(seller.commissionPercentage)}%</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Used when the product category has no override.
              </p>
              <div className="mt-3">
                <SellerCommissionForm
                  sellerId={seller.sellerId}
                  currentRate={Number(seller.commissionPercentage)}
                />
              </div>
            </div>
          </div>

          {seller.gstNumber && (
            <div>
              <div className="text-sm text-muted-foreground">GST Number</div>
              <div className="font-medium">{seller.gstNumber}</div>
            </div>
          )}

          {seller.panNumber && (
            <div>
              <div className="text-sm text-muted-foreground">PAN Number</div>
              <div className="font-medium">{seller.panNumber}</div>
            </div>
          )}

          <div>
            <div className="text-sm text-muted-foreground">Business Address</div>
            <div className="mt-1 space-y-1 text-sm">
              <div>{businessAddress.addressLine1}</div>
              {businessAddress.addressLine2 && <div>{businessAddress.addressLine2}</div>}
              <div>
                {businessAddress.city}, {businessAddress.state} {businessAddress.postalCode}
              </div>
              <div>{businessAddress.country}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Joined</div>
            <div className="font-medium">
              {format(new Date(seller.createdAt), "MMMM dd, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KYC documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">GST certificate</div>
              {seller.kycGstDocumentUrl ? (
                <a
                  href={seller.kycGstDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  View GST file
                </a>
              ) : (
                <div className="font-medium text-muted-foreground">Not uploaded</div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">PAN document</div>
              {seller.kycPanDocumentUrl ? (
                <a
                  href={seller.kycPanDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  View PAN file
                </a>
              ) : (
                <div className="font-medium text-muted-foreground">Not uploaded</div>
              )}
            </div>
          </div>
          <KycActions
            sellerId={seller.sellerId}
            kycStatus={seller.kycStatus}
            hasDocuments={Boolean(
              seller.kycGstDocumentUrl && seller.kycPanDocumentUrl,
            )}
          />
        </CardContent>
      </Card>

      {/* Bank Information */}
      {seller.bankAccountNumber && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Account Holder</div>
                <div className="font-medium">{seller.bankAccountHolder}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Account Number</div>
                <div className="font-medium">
                  ****{seller.bankAccountNumber.slice(-4)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">IFSC Code</div>
                <div className="font-medium">{seller.bankIfscCode}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bank Name</div>
                <div className="font-medium">{seller.bankName}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Products</CardTitle>
          <Link href={`/seller/products?seller=${seller.id}`} className="text-sm text-primary hover:underline">
            View All Products
          </Link>
        </CardHeader>
        <CardContent>
          {seller.products.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No products yet
            </div>
          ) : (
            <div className="space-y-3">
              {seller.products.map((product) => (
                <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(product.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

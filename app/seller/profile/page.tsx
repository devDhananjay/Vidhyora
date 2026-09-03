import type { Metadata } from "next";
import { getActingSeller } from "@/lib/seller-context";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Profile | Seller Dashboard",
};

export default async function SellerProfilePage() {
  const acting = await getActingSeller();

  const sellerProfile = acting
    ? await prisma.sellerProfile.findUnique({
        where: { sellerId: acting.sellerUserId },
        include: {
          seller: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      })
    : null;

  if (!sellerProfile) {
    return <div>Seller profile not found</div>;
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-600">Pending Approval</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-600">Verified</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  const businessAddress = sellerProfile.businessAddress as Record<string, string>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Seller Profile</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your seller account information
        </p>
      </div>

      {/* Account Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getVerificationBadge(sellerProfile.verificationStatus)}
            {sellerProfile.verificationStatus === "REJECTED" && sellerProfile.rejectionReason && (
              <p className="mt-2 text-sm text-destructive">
                Reason: {sellerProfile.rejectionReason}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KYC Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getKycBadge(sellerProfile.kycStatus)}
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{sellerProfile.seller.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{sellerProfile.seller.email}</div>
            </div>
            {sellerProfile.seller.phone && (
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{sellerProfile.seller.phone}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Business Name</div>
              <div className="font-medium">{sellerProfile.businessName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Business Email</div>
              <div className="font-medium">{sellerProfile.businessEmail}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Business Phone</div>
              <div className="font-medium">{sellerProfile.businessPhone}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Commission Rate</div>
              <div className="font-medium">{Number(sellerProfile.commissionPercentage)}%</div>
            </div>
          </div>

          {sellerProfile.gstNumber && (
            <div>
              <div className="text-sm text-muted-foreground">GST Number</div>
              <div className="font-medium">{sellerProfile.gstNumber}</div>
            </div>
          )}

          {sellerProfile.panNumber && (
            <div>
              <div className="text-sm text-muted-foreground">PAN Number</div>
              <div className="font-medium">{sellerProfile.panNumber}</div>
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
        </CardContent>
      </Card>

      {/* Bank Information */}
      {sellerProfile.bankAccountNumber && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Account Holder</div>
                <div className="font-medium">{sellerProfile.bankAccountHolder}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Account Number</div>
                <div className="font-medium">
                  ****{sellerProfile.bankAccountNumber.slice(-4)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">IFSC Code</div>
                <div className="font-medium">{sellerProfile.bankIfscCode}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bank Name</div>
                <div className="font-medium">{sellerProfile.bankName}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

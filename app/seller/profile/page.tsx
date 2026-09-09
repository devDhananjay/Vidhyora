import type { Metadata } from "next";
import { getActingSeller } from "@/lib/seller-context";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KycUploadForm } from "@/components/seller/kyc-upload-form";
import { SellerKycDetailsForm } from "@/components/seller/kyc-details-form";

export const metadata: Metadata = {
  title: "Profile & KYC | Seller Dashboard",
};

function KycBadge({ status }: { status: string }) {
  switch (status) {
    case "VERIFIED":
      return <Badge className="bg-green-600">Verified</Badge>;
    case "PENDING":
      return <Badge className="bg-yellow-600">Pending review</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">Not submitted</Badge>;
  }
}

function VerificationBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED":
      return <Badge className="bg-green-600">Approved</Badge>;
    case "PENDING":
      return <Badge className="bg-yellow-600">Pending approval</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function Step({
  done,
  label,
}: {
  done: boolean;
  label: string;
}) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          done
            ? "bg-green-600 text-white"
            : "border border-neutral-300 text-neutral-500"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-neutral-900" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}

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

  const businessAddress = sellerProfile.businessAddress as Record<string, string>;
  const hasGstNumber = Boolean(sellerProfile.gstNumber);
  const hasPanNumber = Boolean(sellerProfile.panNumber);
  const hasGstDoc = Boolean(sellerProfile.kycGstDocumentUrl);
  const hasPanDoc = Boolean(sellerProfile.kycPanDocumentUrl);
  const canSubmit =
    hasGstNumber && hasPanNumber && hasGstDoc && hasPanDoc;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Profile & KYC
        </h1>
        <p className="mt-2 text-muted-foreground">
          Complete KYC so Super Admin can verify your seller account
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification status</CardTitle>
          </CardHeader>
          <CardContent>
            <VerificationBadge status={sellerProfile.verificationStatus} />
            {sellerProfile.verificationStatus === "REJECTED" &&
            sellerProfile.rejectionReason ? (
              <p className="mt-2 text-sm text-destructive">
                Reason: {sellerProfile.rejectionReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KYC status</CardTitle>
          </CardHeader>
          <CardContent>
            <KycBadge status={sellerProfile.kycStatus} />
            {sellerProfile.kycStatus === "REJECTED" &&
            sellerProfile.kycRejectionReason ? (
              <p className="mt-2 text-sm text-destructive">
                Reason: {sellerProfile.kycRejectionReason}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card id="kyc">
        <CardHeader>
          <CardTitle>Complete KYC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="space-y-2 rounded-2xl border border-neutral-100 bg-[#faf8f6] p-4">
            <Step
              done={hasGstNumber && hasPanNumber}
              label="Step 1 — Enter GST & PAN numbers (and bank details)"
            />
            <Step
              done={hasGstDoc && hasPanDoc}
              label="Step 2 — Upload GST certificate & PAN document"
            />
            <Step
              done={
                sellerProfile.kycStatus === "PENDING" ||
                sellerProfile.kycStatus === "VERIFIED"
              }
              label="Step 3 — Submit for Super Admin review"
            />
            <Step
              done={sellerProfile.kycStatus === "VERIFIED"}
              label="Step 4 — Wait for verification"
            />
          </ol>

          {acting?.isAdminView ? (
            <p className="text-sm text-muted-foreground">
              Seller admin must complete KYC from their own login. Super Admin
              verifies documents on the seller detail page.
            </p>
          ) : (
            <>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                  Step 1 — Numbers & bank
                </h3>
                <SellerKycDetailsForm
                  initialGstNumber={sellerProfile.gstNumber || ""}
                  initialPanNumber={sellerProfile.panNumber || ""}
                  initialBankAccountHolder={
                    sellerProfile.bankAccountHolder || ""
                  }
                  initialBankAccountNumber={
                    sellerProfile.bankAccountNumber || ""
                  }
                  initialBankIfscCode={sellerProfile.bankIfscCode || ""}
                  initialBankName={sellerProfile.bankName || ""}
                  canSubmit={canSubmit}
                  kycStatus={sellerProfile.kycStatus}
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                  Step 2 — Documents
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <KycUploadForm
                    kind="gst"
                    label="GST certificate"
                    currentUrl={sellerProfile.kycGstDocumentUrl}
                  />
                  <KycUploadForm
                    kind="pan"
                    label="PAN document"
                    currentUrl={sellerProfile.kycPanDocumentUrl}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  JPG, PNG, WEBP or PDF up to 5 MB.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
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
            {sellerProfile.seller.phone ? (
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{sellerProfile.seller.phone}</div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Business name</div>
              <div className="font-medium">{sellerProfile.businessName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Business email</div>
              <div className="font-medium">{sellerProfile.businessEmail}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Business phone</div>
              <div className="font-medium">{sellerProfile.businessPhone}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Commission rate</div>
              <div className="font-medium">
                {Number(sellerProfile.commissionPercentage)}%
              </div>
            </div>
            {sellerProfile.gstNumber ? (
              <div>
                <div className="text-sm text-muted-foreground">GST number</div>
                <div className="font-medium">{sellerProfile.gstNumber}</div>
              </div>
            ) : null}
            {sellerProfile.panNumber ? (
              <div>
                <div className="text-sm text-muted-foreground">PAN number</div>
                <div className="font-medium">{sellerProfile.panNumber}</div>
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Business address</div>
            <div className="mt-1 space-y-1 text-sm">
              <div>{businessAddress.addressLine1}</div>
              {businessAddress.addressLine2 ? (
                <div>{businessAddress.addressLine2}</div>
              ) : null}
              <div>
                {businessAddress.city}, {businessAddress.state}{" "}
                {businessAddress.postalCode}
              </div>
              <div>{businessAddress.country}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

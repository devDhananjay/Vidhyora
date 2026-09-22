import type { Metadata } from "next";
import { getActingSeller } from "@/lib/seller-context";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SellerSettingsForm } from "@/components/seller/seller-settings-form";

export const metadata: Metadata = {
  title: "Settings | Seller Dashboard",
};

export default async function SellerSettingsPage() {
  const acting = await getActingSeller();
  const profile = acting
    ? await prisma.sellerProfile.findUnique({
        where: { sellerId: acting.sellerUserId },
        include: {
          seller: {
            select: { name: true, email: true, phone: true },
          },
        },
      })
    : null;

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Settings
        </h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No seller account is available to review yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Store, payout and notification preferences for {profile.businessName}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact name</label>
            <Input defaultValue={profile.seller.name ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Login email</label>
            <Input defaultValue={profile.seller.email} readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Commission</label>
            <Input
              defaultValue={`${Number(profile.commissionPercentage)}%`}
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editable preferences</CardTitle>
        </CardHeader>
        <CardContent>
          {acting?.isAdminView ? (
            <p className="text-sm text-muted-foreground">
              Seller admin updates these from their own login.
            </p>
          ) : (
            <SellerSettingsForm
              businessPhone={profile.businessPhone}
              notifyNewOrders={profile.notifyNewOrders}
              notifyLowStock={profile.notifyLowStock}
              preferredCourier={profile.preferredCourier || ""}
              processingDays={profile.processingDays}
              bankAccountHolder={profile.bankAccountHolder || ""}
              bankAccountNumber={profile.bankAccountNumber || ""}
              bankIfscCode={profile.bankIfscCode || ""}
              bankName={profile.bankName || ""}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

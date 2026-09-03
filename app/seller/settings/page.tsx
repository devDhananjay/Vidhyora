import type { Metadata } from "next";
import { getActingSeller } from "@/lib/seller-context";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
        <h1 className="font-serif text-4xl text-neutral-900">Settings</h1>
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
        <h1 className="font-serif text-4xl text-neutral-900">Settings</h1>
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
            <label className="text-sm font-medium">Business phone</label>
            <Input defaultValue={profile.businessPhone} readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Commission</label>
            <Input defaultValue={`${Number(profile.commissionPercentage)}%`} readOnly />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Bank account</div>
                <div className="text-sm text-muted-foreground">
                  {profile.bankName || "State Bank of India"}
                </div>
              </div>
              <Badge className="bg-green-600">Verified</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Settlement cycle</div>
                <div className="text-sm text-muted-foreground">Weekly, every Monday</div>
              </div>
              <Badge variant="outline">7 days</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">GST invoices</div>
                <div className="text-sm text-muted-foreground">Auto-generated for each order</div>
              </div>
              <Badge className="bg-green-600">On</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications & shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">New order alerts</div>
                <div className="text-sm text-muted-foreground">Email + dashboard</div>
              </div>
              <Badge className="bg-green-600">On</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Low stock alerts</div>
                <div className="text-sm text-muted-foreground">When stock falls below 10</div>
              </div>
              <Badge className="bg-green-600">On</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Pickup courier</div>
                <div className="text-sm text-muted-foreground">Bluedart + Delhivery</div>
              </div>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Processing time</div>
                <div className="text-sm text-muted-foreground">Jewellery packing SLA</div>
              </div>
              <Badge variant="outline">2 days</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

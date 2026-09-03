import type { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION, DEFAULT_CURRENCY } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Settings | Super Admin",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Platform configuration used across storefront, checkout and seller tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Store name</label>
            <Input defaultValue={APP_NAME} readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Support email</label>
            <Input defaultValue="hello@vidyora.com" readOnly />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Tagline</label>
            <Input defaultValue={APP_DESCRIPTION} readOnly />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commerce</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Currency</div>
                <div className="text-sm text-muted-foreground">Checkout and catalogue</div>
              </div>
              <Badge variant="outline">{DEFAULT_CURRENCY}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Default seller commission</div>
                <div className="text-sm text-muted-foreground">Applied to new sellers</div>
              </div>
              <Badge variant="outline">10%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Jewellery GST</div>
                <div className="text-sm text-muted-foreground">Shown on invoices</div>
              </div>
              <Badge variant="outline">3%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Free shipping above</div>
                <div className="text-sm text-muted-foreground">Otherwise ₹50 shipping</div>
              </div>
              <Badge variant="outline">₹500</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies & payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Product approval</div>
                <div className="text-sm text-muted-foreground">New listings need admin review</div>
              </div>
              <Badge className="bg-green-600">On</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Review moderation</div>
                <div className="text-sm text-muted-foreground">Customer reviews stay pending</div>
              </div>
              <Badge className="bg-green-600">On</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Razorpay</div>
                <div className="text-sm text-muted-foreground">Online card / UPI / netbanking</div>
              </div>
              <Badge className="bg-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Cash on delivery</div>
                <div className="text-sm text-muted-foreground">Available at checkout</div>
              </div>
              <Badge className="bg-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Return window</div>
                <div className="text-sm text-muted-foreground">Default for jewellery SKUs</div>
              </div>
              <Badge variant="outline">7 days</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

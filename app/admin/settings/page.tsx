import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME, APP_DESCRIPTION, DEFAULT_CURRENCY } from "@/lib/constants";
import { DEFAULT_COMMISSION_PERCENTAGE } from "@/lib/commission";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { getCommissionSettings } from "@/actions/admin/manage-commission";
import {
  ensureSiteSettingsSeeded,
  getSiteSettingsForAdmin,
} from "@/lib/content/get-site-settings";
import { CategoryCommissionRow } from "@/components/admin/category-commission-row";
import { SiteContactSettingsForm } from "@/components/admin/site-contact-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Website Settings | Super Admin",
};

export default async function AdminSettingsPage() {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/admin");
  }

  await ensureSiteSettingsSeeded();
  const [commission, site] = await Promise.all([
    getCommissionSettings(),
    getSiteSettingsForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Website Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Contact email, phone, social links, commission and platform options.
        </p>
      </div>

      <SiteContactSettingsForm
        initialData={site.data}
        updatedAt={site.updatedAt?.toISOString() ?? null}
        source={site.source}
      />

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
            <label className="text-sm font-medium">Support email (live)</label>
            <Input defaultValue={site.data.contact.supportEmail} readOnly />
            <p className="text-xs text-muted-foreground">
              Edit in Website contact & social above.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Tagline</label>
            <Input defaultValue={APP_DESCRIPTION} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Split on each paid item: category rate if set, otherwise the seller
            admin&apos;s rate, otherwise {commission.defaultRate}%. Changing a
            rate applies to new paid orders only. Per-seller rates are on each{" "}
            <Link href="/admin/sellers" className="text-primary hover:underline">
              seller admin
            </Link>{" "}
            profile.
          </p>
          {commission.categories.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Add categories first, then set jewellery / gold / diamond rates
              here.
            </div>
          ) : (
            <div>
              {commission.categories.map((category) => (
                <div key={category.id}>
                  <CategoryCommissionRow
                    categoryId={category.id}
                    name={category.name}
                    currentRate={
                      category.commissionPercentage == null
                        ? null
                        : Number(category.commissionPercentage)
                    }
                  />
                  {category.children.map((child) => (
                    <div key={child.id} className="pl-6">
                      <CategoryCommissionRow
                        categoryId={child.id}
                        name={`${category.name} / ${child.name}`}
                        currentRate={
                          child.commissionPercentage == null
                            ? null
                            : Number(child.commissionPercentage)
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commerce (code defaults)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These values are fixed in app code today — display only, not
              editable from admin.
            </p>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Currency</div>
                <div className="text-sm text-muted-foreground">
                  Checkout and catalogue
                </div>
              </div>
              <Badge variant="outline">{DEFAULT_CURRENCY}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Default seller commission</div>
                <div className="text-sm text-muted-foreground">
                  Applied to new sellers
                </div>
              </div>
              <Badge variant="outline">{DEFAULT_COMMISSION_PERCENTAGE}%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Jewellery GST</div>
                <div className="text-sm text-muted-foreground">
                  Shown on invoices
                </div>
              </div>
              <Badge variant="outline">3%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Free shipping above</div>
                <div className="text-sm text-muted-foreground">
                  Otherwise ₹50 shipping
                </div>
              </div>
              <Badge variant="outline">₹500</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies & payments (code defaults)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Runtime flags live in code. Badge status is informational.
            </p>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Product approval</div>
                <div className="text-sm text-muted-foreground">
                  New listings need admin review
                </div>
              </div>
              <Badge className="bg-green-600">On</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Review moderation</div>
                <div className="text-sm text-muted-foreground">
                  Customer reviews stay pending
                </div>
              </div>
              <Badge className="bg-green-600">On</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Razorpay</div>
                <div className="text-sm text-muted-foreground">
                  Online card / UPI / netbanking
                </div>
              </div>
              <Badge className="bg-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Cash on delivery</div>
                <div className="text-sm text-muted-foreground">
                  Available at checkout
                </div>
              </div>
              <Badge className="bg-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <div className="font-medium">Return window</div>
                <div className="text-sm text-muted-foreground">
                  Default for jewellery SKUs
                </div>
              </div>
              <Badge variant="outline">7 days</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

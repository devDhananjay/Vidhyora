import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllCoupons } from "@/actions/admin/manage-coupons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouponActions } from "@/components/admin/coupon-actions";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Coupons | Super Admin",
};

export default async function AdminCouponsPage() {
  const coupons = await getAllCoupons();

  const activeCoupons = coupons.filter((c) => c.isActive);
  const expiredCoupons = coupons.filter((c) => c.expiryDate < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Coupon Management</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {coupons.length} coupons • {activeCoupons.length} active
          </p>
        </div>
        <Link href="/admin/coupons/new" className="self-start">
          <Button className="gap-2">
            <Plus className="size-4" />
            Create Coupon
          </Button>
        </Link>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No coupons yet. Create your first coupon to offer discounts.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const isExpired = coupon.expiryDate < new Date();
            const isActive = coupon.isActive && !isExpired;

            return (
              <Card key={coupon.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="font-mono text-xl font-bold sm:text-2xl">{coupon.code}</h3>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isExpired ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${Number(coupon.discountValue)}% OFF`
                            : `${formatCurrency(Number(coupon.discountValue))} OFF`}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="text-muted-foreground">Minimum Order:</span>{" "}
                          <span className="font-medium">
                            {Number(coupon.minimumOrderValue)
                              ? formatCurrency(Number(coupon.minimumOrderValue))
                              : "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Discount:</span>{" "}
                          <span className="font-medium">
                            {coupon.maximumDiscount
                              ? formatCurrency(Number(coupon.maximumDiscount))
                              : "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Usage:</span>{" "}
                          <span className="font-medium">
                            {coupon.usageCount}
                            {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / unlimited"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valid Until:</span>{" "}
                          <span className="font-medium">
                            {format(coupon.expiryDate, "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CouponActions couponId={coupon.id} isActive={coupon.isActive} />
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

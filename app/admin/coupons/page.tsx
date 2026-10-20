import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCouponPerformance } from "@/actions/admin/manage-coupons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouponActions } from "@/components/admin/coupon-actions";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Coupons | Admin",
};

export default async function AdminCouponsPage() {
  const coupons = await getCouponPerformance();

  const activeCoupons = coupons.filter((c) => c.isActive);
  const expiredCoupons = coupons.filter((c) => c.expiryDate < new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand sm:text-4xl">
            Coupon Management
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {coupons.length} coupons • {activeCoupons.length} active
            {expiredCoupons.length
              ? ` • ${expiredCoupons.length} expired`
              : ""}
          </p>
        </div>
        <Link href="/admin/coupons/new" className="self-start">
          <Button className="gap-2">
            <Plus className="size-4" />
            Create Coupon
          </Button>
        </Link>
      </div>

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
            const usageLimit = coupon.usageLimit ?? null;
            const usagePct =
              usageLimit && usageLimit > 0
                ? (coupon.usageCount / usageLimit) * 100
                : 0;
            const nearCap = usageLimit != null && usagePct >= 80;
            const maxPerUse = Number(
              coupon.maximumDiscount ?? coupon.discountValue,
            );
            const spentEstimate = coupon.usageCount * maxPerUse;
            const remainingUses =
              usageLimit != null
                ? Math.max(0, usageLimit - coupon.usageCount)
                : null;
            const remainingLiability =
              remainingUses != null ? remainingUses * maxPerUse : null;

            return (
              <Card key={coupon.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="font-mono text-xl font-bold sm:text-2xl">
                          {coupon.code}
                        </h3>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isExpired
                            ? "Expired"
                            : coupon.isActive
                              ? "Active"
                              : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${Number(coupon.discountValue)}% OFF`
                            : `${formatCurrency(Number(coupon.discountValue))} OFF`}
                        </Badge>
                        {nearCap ? (
                          <Badge variant="destructive">
                            {Math.round(usagePct)}% usage — near cap
                          </Badge>
                        ) : null}
                      </div>

                      {coupon.description ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {coupon.description}
                        </p>
                      ) : null}

                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <div>
                          <span className="text-muted-foreground">
                            Minimum Order:
                          </span>{" "}
                          <span className="font-medium">
                            {Number(coupon.minimumOrderValue)
                              ? formatCurrency(Number(coupon.minimumOrderValue))
                              : "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Max Discount:
                          </span>{" "}
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
                            {coupon.usageLimit
                              ? ` / ${coupon.usageLimit}`
                              : " / unlimited"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Per customer:
                          </span>{" "}
                          <span className="font-medium">
                            {coupon.perUserLimit}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Discount given (est.):
                          </span>{" "}
                          <span className="font-medium">
                            {formatCurrency(spentEstimate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue:</span>{" "}
                          <span className="font-medium">
                            {formatCurrency(coupon.revenue)}
                            {coupon.orderCount
                              ? ` (${coupon.orderCount} orders)`
                              : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Remaining liability (est.):
                          </span>{" "}
                          <span className="font-medium">
                            {remainingLiability != null
                              ? formatCurrency(remainingLiability)
                              : " uncapped"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Valid Until:
                          </span>{" "}
                          <span className="font-medium">
                            {format(coupon.expiryDate, "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CouponActions
                      couponId={coupon.id}
                      isActive={coupon.isActive}
                    />
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

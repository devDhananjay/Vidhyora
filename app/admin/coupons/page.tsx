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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl text-neutral-900">Coupon Management</h1>
          <p className="mt-2 text-muted-foreground">
            {coupons.length} coupons • {activeCoupons.length} active
          </p>
        </div>
        <Link href="/admin/coupons/new">
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
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-mono text-2xl font-bold">{coupon.code}</h3>
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

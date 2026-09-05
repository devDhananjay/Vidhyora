import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/coupon-form";
import { getCouponById } from "@/actions/admin/manage-coupons";

export const metadata: Metadata = {
  title: "Edit Coupon | Super Admin",
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getCouponById(id);

  if (!coupon) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Edit Coupon</h1>
        <p className="mt-2 text-muted-foreground">
          Update coupon information
        </p>
      </div>

      <CouponForm coupon={coupon} />
    </div>
  );
}

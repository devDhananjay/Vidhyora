import type { Metadata} from "next";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata: Metadata = {
  title: "Create Coupon | Super Admin",
};

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Create Coupon</h1>
        <p className="mt-2 text-muted-foreground">
          Create a new discount coupon for customers
        </p>
      </div>

      <CouponForm />
    </div>
  );
}

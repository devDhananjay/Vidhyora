"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { couponSchema, type CouponInput } from "@/lib/validations/coupon";
import { createCoupon, updateCoupon } from "@/actions/admin/manage-coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type CouponFormProps = {
  coupon?: any;
};

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
          minimumOrderValue: Number(coupon.minimumOrderValue) || undefined,
          maximumDiscount: coupon.maximumDiscount
            ? Number(coupon.maximumDiscount)
            : undefined,
          startDate: new Date(coupon.startDate).toISOString().split("T")[0],
          expiryDate: new Date(coupon.expiryDate).toISOString().split("T")[0],
          usageLimit: coupon.usageLimit ?? undefined,
          perUserLimit: coupon.perUserLimit ?? undefined,
          isActive: coupon.isActive,
        }
      : {
          discountType: "PERCENTAGE",
          isActive: true,
        },
  });

  const discountType = watch("discountType");
  const codeRegister = register("code");

  const onSubmit = async (data: CouponInput) => {
    startTransition(async () => {
      const result = coupon
        ? await updateCoupon(coupon.id, data)
        : await createCoupon(data);

      if (result.success) {
        router.push("/admin/coupons");
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              {...codeRegister}
              placeholder="SUMMER25"
              className="mt-2 font-mono uppercase"
              onChange={(event) => {
                event.target.value = event.target.value.toUpperCase();
                void codeRegister.onChange(event);
              }}
            />
            {errors.code && <p className="mt-1 text-sm text-destructive">{errors.code.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="discountType">Discount Type *</Label>
              <Select
                onValueChange={(value: "PERCENTAGE" | "FIXED") => setValue("discountType", value)}
                defaultValue={watch("discountType")}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="discountValue">
                Discount Value * {discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                {...register("discountValue", { valueAsNumber: true })}
                className="mt-2"
              />
              {errors.discountValue && <p className="mt-1 text-sm text-destructive">{errors.discountValue.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="minimumOrderValue">Minimum Order Value (₹)</Label>
              <Input
                id="minimumOrderValue"
                type="number"
                step="0.01"
                {...register("minimumOrderValue", { valueAsNumber: true })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="maximumDiscount">Maximum Discount (₹)</Label>
              <Input
                id="maximumDiscount"
                type="number"
                step="0.01"
                {...register("maximumDiscount", { valueAsNumber: true })}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="mt-2"
              />
              {errors.startDate && <p className="mt-1 text-sm text-destructive">{errors.startDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                {...register("expiryDate")}
                className="mt-2"
              />
              {errors.expiryDate && <p className="mt-1 text-sm text-destructive">{errors.expiryDate.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="usageLimit">Total Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                {...register("usageLimit", { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="perUserLimit">Per User Limit</Label>
              <Input
                id="perUserLimit"
                type="number"
                {...register("perUserLimit", { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="isActive" className="cursor-pointer">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                {watch("isActive") ? "Coupon is active" : "Coupon is inactive"}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (coupon ? "Updating..." : "Creating...") : (coupon ? "Update Coupon" : "Create Coupon")}
        </Button>
      </div>
    </form>
  );
}

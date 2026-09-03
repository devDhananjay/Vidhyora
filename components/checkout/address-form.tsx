"use client";

import { useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/address";
import { createAddress } from "@/actions/address/create-address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddressFormProps = {
  onSuccess?: () => void;
};

type AddressFormValues = Partial<AddressInput>;

export function AddressForm({ onSuccess }: AddressFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema) as any,
  });

  const onSubmit: SubmitHandler<AddressFormValues> = async (data) => {
    startTransition(async () => {
      const formData = new FormData();
      
      // Set defaults for optional fields
      const submitData = {
        ...data,
        country: data.country || "IN",
        type: data.type || "SHIPPING",
        isDefault: data.isDefault || false,
      };
      
      Object.entries(submitData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await createAddress(formData);

      if (result.success) {
        reset();
        onSuccess?.();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="addressLine1">Address Line 1 *</Label>
        <Input
          id="addressLine1"
          {...register("addressLine1")}
          placeholder="House No., Building Name"
        />
        {errors.addressLine1 && (
          <p className="mt-1 text-sm text-destructive">
            {errors.addressLine1.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input
          id="addressLine2"
          {...register("addressLine2")}
          placeholder="Road Name, Area, Colony"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="landmark">Landmark</Label>
          <Input
            id="landmark"
            {...register("landmark")}
            placeholder="Near..."
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            {...register("postalCode")}
            placeholder="Enter PIN code"
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-destructive">
              {errors.postalCode.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input id="city" {...register("city")} placeholder="Enter city" />
          {errors.city && (
            <p className="mt-1 text-sm text-destructive">
              {errors.city.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="state">State *</Label>
          <Input id="state" {...register("state")} placeholder="Enter state" />
          {errors.state && (
            <p className="mt-1 text-sm text-destructive">
              {errors.state.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          {...register("isDefault")}
          className="size-4"
        />
        <Label htmlFor="isDefault" className="cursor-pointer font-normal">
          Make this my default address
        </Label>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : "Save Address"}
      </Button>
    </form>
  );
}

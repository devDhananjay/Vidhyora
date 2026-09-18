"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  sellerRegistrationSchema,
  type SellerRegistrationInput,
} from "@/lib/validations/auth";
import { registerSellerAction } from "@/actions/auth/register-seller";
import { lookupAddressByPincode } from "@/actions/maps/google-places";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";

export function SellerRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinPending, startPin] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SellerRegistrationInput>({
    resolver: zodResolver(sellerRegistrationSchema),
  });

  const addressValue = watch("address") || "";
  const postalValue = watch("postalCode") || "";

  const onSubmit = async (data: SellerRegistrationInput) => {
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await registerSellerAction(data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 5000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  function onPinChange(raw: string) {
    const pin = raw.replace(/\D/g, "").slice(0, 6);
    setValue("postalCode", pin, { shouldValidate: true });
    if (pin.length !== 6) return;
    startPin(async () => {
      const result = await lookupAddressByPincode(pin);
      if (!result.success) return;
      if (result.data.city) {
        setValue("city", result.data.city, { shouldValidate: true });
      }
      if (result.data.state) {
        setValue("state", result.data.state, { shouldValidate: true });
      }
    });
  }

  if (success) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="size-4 text-green-600" />
        <AlertDescription className="text-green-900">
          Seller account created successfully! Please check your email to verify
          your account. Your application will be reviewed by our team.
          Redirecting to login...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Details</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+919876543210"
              {...register("phone")}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Business Details</h3>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            {...register("businessName")}
            disabled={isLoading}
          />
          {errors.businessName && (
            <p className="text-sm text-destructive">
              {errors.businessName.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email</Label>
            <Input
              id="businessEmail"
              type="email"
              {...register("businessEmail")}
              disabled={isLoading}
            />
            {errors.businessEmail && (
              <p className="text-sm text-destructive">
                {errors.businessEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPhone">Business Phone</Label>
            <Input
              id="businessPhone"
              type="tel"
              {...register("businessPhone")}
              disabled={isLoading}
            />
            {errors.businessPhone && (
              <p className="text-sm text-destructive">
                {errors.businessPhone.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gstNumber">
              GST Number <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="gstNumber"
              placeholder="27AABCT1234F1Z5"
              {...register("gstNumber")}
              disabled={isLoading}
            />
            {errors.gstNumber && (
              <p className="text-sm text-destructive">
                {errors.gstNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="panNumber">
              PAN Number <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="panNumber"
              placeholder="ABCTY1234D"
              {...register("panNumber")}
              disabled={isLoading}
            />
            {errors.panNumber && (
              <p className="text-sm text-destructive">
                {errors.panNumber.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Business Address</h3>

        <div className="space-y-2">
          <AddressAutocomplete
            value={addressValue}
            disabled={isLoading}
            onChange={(next) =>
              setValue("address", next, { shouldValidate: true })
            }
            onResolved={(place) => {
              if (place.line1 || place.formattedAddress) {
                setValue(
                  "address",
                  place.line1 || place.formattedAddress || addressValue,
                  { shouldValidate: true },
                );
              }
              if (place.city) {
                setValue("city", place.city, { shouldValidate: true });
              }
              if (place.state) {
                setValue("state", place.state, { shouldValidate: true });
              }
              const pin = (place.postalCode || "").replace(/\D/g, "").slice(0, 6);
              if (pin.length === 6) {
                setValue("postalCode", pin, {
                  shouldValidate: true,
                });
              }
            }}
            label="Address"
            placeholder="Search shop, building or area"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register("city")}
              disabled={isLoading}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              {...register("state")}
              disabled={isLoading}
            />
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">PIN Code</Label>
            <div className="relative">
              <Input
                id="postalCode"
                placeholder="400001"
                value={postalValue}
                onChange={(e) => onPinChange(e.target.value)}
                disabled={isLoading}
                maxLength={6}
                inputMode="numeric"
              />
              {pinPending ? (
                <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-neutral-400" />
              ) : null}
            </div>
            {errors.postalCode && (
              <p className="text-sm text-destructive">
                {errors.postalCode.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Register as Seller
      </Button>
    </form>
  );
}

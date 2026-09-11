"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth/login";
import {
  sendPhoneOtp,
  verifyPhoneOtpAndSignIn,
} from "@/actions/auth/phone-otp";
import { dashboardPath } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Loader2 } from "lucide-react";
import {
  AuthProviderDivider,
  GoogleSignInButton,
} from "@/components/auth/google-sign-in-button";
import { safeCallbackPath } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";

const OAUTH_ERRORS: Record<string, string> = {
  inactive:
    "This account is inactive. Contact Super Admin to restore access.",
  AccessDenied:
    "This account is inactive or Google sign-in was denied.",
  Configuration:
    "Google sign-in failed. Clear site cookies for localhost and try again.",
  OAuthAccountNotLinked:
    "This email is already registered. Sign in with your password, then you can use Google.",
  OAuthCallback: "Google sign-in failed. Please try again.",
  Callback: "Google sign-in failed. Please try again.",
  Default: "Google sign-in failed. Please try again.",
};

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  otp: z.string().trim().optional(),
});

type PhoneInput = z.infer<typeof phoneSchema>;

export function LoginForm({
  callbackUrl,
  oauthError,
  phoneOtpEnabled = false,
}: {
  callbackUrl?: string;
  oauthError?: string;
  phoneOtpEnabled?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [error, setError] = useState(
    oauthError ? OAUTH_ERRORS[oauthError] || OAUTH_ERRORS.Default : "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [acceptSellerTerms, setAcceptSellerTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const phoneForm = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "", otp: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    setIsLoading(true);

    try {
      const result = await loginAction(data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.data.role === "SELLER" && !acceptSellerTerms) {
        setError(
          "Please accept the Seller Terms & Conditions before continuing.",
        );
        return;
      }

      const next = safeCallbackPath(callbackUrl);
      if (next) {
        router.push(next);
      } else {
        router.push(dashboardPath(result.data.role));
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onSendOtp = async (data: PhoneInput) => {
    setError("");
    setIsLoading(true);
    try {
      const result = await sendPhoneOtp(data.phone);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOtpSent(true);
      if (result.data.devHint) {
        setError(result.data.devHint);
      }
    } catch {
      setError("Could not send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (data: PhoneInput) => {
    setError("");
    if (!data.otp?.trim()) {
      setError("Enter the OTP sent to your phone");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyPhoneOtpAndSignIn(data.phone, data.otp.trim());
      if (!result.success) {
        setError(result.error);
        return;
      }
      const next = safeCallbackPath(callbackUrl);
      if (next) {
        router.push(next);
      } else {
        router.push(dashboardPath(result.data.role));
      }
      router.refresh();
    } catch {
      setError("Could not verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <GoogleSignInButton callbackUrl={callbackUrl} label="Sign in with Google" />
      <AuthProviderDivider />

      {phoneOtpEnabled ? (
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full border border-neutral-200 bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => {
            setTab("email");
            setError("");
          }}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-medium transition",
            tab === "email"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800",
          )}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("phone");
            setError("");
          }}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-medium transition",
            tab === "phone"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800",
          )}
        >
          Phone OTP
        </button>
      </div>
      ) : null}

      {tab === "email" || !phoneOtpEnabled ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[#8b2e2e]"
              checked={acceptSellerTerms}
              onChange={(e) => setAcceptSellerTerms(e.target.checked)}
              disabled={isLoading}
            />
            <span className="leading-5 text-neutral-700">
              Sellers: I accept the{" "}
              <Link
                href="/terms-and-conditions"
                target="_blank"
                className="font-medium text-[#8b2e2e] underline"
              >
                Terms &amp; Conditions
              </Link>{" "}
              for selling on VIDYORA.
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      ) : (
        <form
          onSubmit={phoneForm.handleSubmit(otpSent ? onVerifyOtp : onSendOtp)}
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              {...phoneForm.register("phone")}
              disabled={isLoading || otpSent}
            />
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          {otpSent ? (
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                {...phoneForm.register("otp")}
                disabled={isLoading}
              />
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {otpSent ? "Verify & sign in" : "Send OTP"}
          </Button>

          {otpSent ? (
            <button
              type="button"
              className="w-full text-center text-sm text-[#8b2e2e] hover:underline"
              onClick={() => {
                setOtpSent(false);
                phoneForm.setValue("otp", "");
                setError("");
              }}
              disabled={isLoading}
            >
              Change number
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}

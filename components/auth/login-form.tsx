"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth/login";
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

export function LoginForm({
  callbackUrl,
  oauthError,
}: {
  callbackUrl?: string;
  oauthError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(
    oauthError ? OAUTH_ERRORS[oauthError] || OAUTH_ERRORS.Default : "",
  );
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
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

      const next = safeCallbackPath(callbackUrl);
      if (next) {
        router.push(next);
      } else {
        router.push(dashboardPath(result.data.role));
      }
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <GoogleSignInButton callbackUrl={callbackUrl} label="Sign in with Google" />
      <AuthProviderDivider />
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
    </div>
  );
}

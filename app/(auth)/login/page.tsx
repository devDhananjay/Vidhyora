import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Login",
  description: `Sign in to your ${APP_NAME} account`,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to continue to VIDYORA"
      footer={
        <>
          <div>
            <Link href="/forgot-password" className="text-[#8b2e2e] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#8b2e2e] hover:underline">
              Sign up
            </Link>
          </div>
          <div>
            Want to sell on {APP_NAME}?{" "}
            <Link href="/seller/register" className="text-[#8b2e2e] hover:underline">
              Partner with Us
            </Link>
          </div>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthFrame>
  );
}

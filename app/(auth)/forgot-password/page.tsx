import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <div>
          Remember your password?{" "}
          <Link href="/login" className="text-[#8b2e2e] hover:underline">
            Sign in
          </Link>
        </div>
      }
    >
      <ForgotPasswordForm />
    </AuthFrame>
  );
}

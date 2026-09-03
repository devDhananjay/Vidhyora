import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Create a new password",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <AuthFrame
      title="Reset password"
      subtitle="Enter your new password below"
      footer={
        <Link href="/login" className="text-[#8b2e2e] hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm searchParams={searchParams} />
    </AuthFrame>
  );
}

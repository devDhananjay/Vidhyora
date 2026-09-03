import type { Metadata } from "next";
import Link from "next/link";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
};

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <AuthFrame
      title="Verify your email"
      subtitle="Complete your account setup"
      footer={
        <Link href="/login" className="text-[#8b2e2e] hover:underline">
          Back to sign in
        </Link>
      }
    >
      <VerifyEmailForm searchParams={searchParams} />
    </AuthFrame>
  );
}

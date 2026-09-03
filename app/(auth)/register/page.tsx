import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Register",
  description: `Create your ${APP_NAME} account`,
};

export default function RegisterPage() {
  return (
    <AuthFrame
      title="Create an account"
      subtitle="Sign up to start shopping jewellery"
      footer={
        <div>
          Already have an account?{" "}
          <Link href="/login" className="text-[#8b2e2e] hover:underline">
            Sign in
          </Link>
        </div>
      }
    >
      <RegisterForm />
    </AuthFrame>
  );
}

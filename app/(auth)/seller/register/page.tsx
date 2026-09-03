import type { Metadata } from "next";
import Link from "next/link";
import { SellerRegisterForm } from "@/components/auth/seller-register-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Seller Registration",
  description: `Become a seller on ${APP_NAME}`,
};

export default function SellerRegisterPage() {
  return (
    <AuthFrame
      wide
      title="Become a Seller"
      subtitle={`Start selling on ${APP_NAME} and reach jewellery lovers across India`}
      footer={
        <div>
          Already have an account?{" "}
          <Link href="/login" className="text-[#8b2e2e] hover:underline">
            Sign in
          </Link>
        </div>
      }
    >
      <SellerRegisterForm />
    </AuthFrame>
  );
}

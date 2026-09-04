import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { isSellerAdmin, isSuperAdmin } from "@/lib/roles";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Partner with Us | VIDYORA",
  description: "List your jewellery boutique on VIDYORA and sell gold and diamond jewellery across India.",
};

export default async function PartnerPage() {
  const session = await auth();
  const alreadySeller =
    isSellerAdmin(session?.user?.role) || isSuperAdmin(session?.user?.role);
  const applyHref = alreadySeller ? ROUTES.seller.root : ROUTES.auth.sellerRegister;

  return (
    <div className="bg-[#faf8f6]">
      <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
          Seller Admin
        </p>
        <h1 className="mt-3 font-serif text-4xl text-neutral-900 md:text-5xl">
          Partner with VIDYORA
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-600">
          List certified gold, diamond and wedding jewellery. Super Admin
          approves your boutique, then you manage catalogue, orders and payouts
          from your Seller Admin dashboard.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full px-6">
            <Link href={applyHref}>
              <Handshake className="mr-2 size-4" />
              {alreadySeller ? "Open Seller Admin" : "Apply to sell"}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href={ROUTES.contact}>Talk to us</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Step
            icon={Store}
            title="Create your boutique"
            text="Share business name, GST and contact. We review KYC before listings go live."
          />
          <Step
            icon={ShieldCheck}
            title="Get approved"
            text="Super Admin verifies your profile. Approved products appear on the storefront."
          />
          <Step
            icon={TrendingUp}
            title="Sell and get paid"
            text="Pack, ship and mark orders. Earnings settle after commission on paid sales."
          />
        </div>
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Store;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-6">
      <Icon className="size-6 text-[#8b2e2e]" strokeWidth={1.5} />
      <h2 className="mt-4 font-serif text-xl text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export function AccountBackLink({
  label = "Back to Account Settings",
}: {
  label?: string;
}) {
  return (
    <Link
      href={ROUTES.account}
      className="mb-4 inline-flex items-center gap-2 text-sm text-[#8b2e2e] transition hover:underline"
    >
      <ArrowLeft className="size-4" strokeWidth={1.8} />
      {label}
    </Link>
  );
}

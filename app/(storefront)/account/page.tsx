import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserAddresses } from "@/actions/address/get-addresses";
import { AccountSettingsShell } from "@/components/account/account-settings-shell";
import { requireAuthOrRedirect } from "@/lib/auth-helpers";
import { ROUTES } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Account Settings | VIDYORA",
  description: "Manage your VIDYORA profile, password and saved addresses.",
};

export default async function AccountPage() {
  const session = await requireAuthOrRedirect(ROUTES.account);

  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        passwordHash: true,
        role: true,
        createdAt: true,
      },
    }),
    getUserAddresses(),
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <AccountSettingsShell
      userName={user.name || "Customer"}
      roleLabel={roleLabel(user.role)}
      memberSince={user.createdAt.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })}
      email={user.email}
      initialName={user.name ?? ""}
      initialPhone={user.phone ?? ""}
      hasExistingPassword={Boolean(user.passwordHash)}
      addresses={addresses}
    />
  );
}

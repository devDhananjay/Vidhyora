import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <DashboardShell
      variant="admin"
      userName={session.user.name}
      extraLinks={[
        { href: "/", label: "View Storefront" },
        { href: "/seller", label: "Monitor Seller Admins" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}

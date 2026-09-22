import { requireAdmin } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAdminNavBadges } from "@/lib/admin/nav-badges";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const isSuper = session.user.role === "SUPER_ADMIN";
  const navBadges = isSuper ? await getAdminNavBadges() : undefined;

  return (
    <DashboardShell
      variant="admin"
      userName={session.user.name}
      userRole={session.user.role}
      navBadges={navBadges}
      extraLinks={[
        { href: "/", label: "View Storefront" },
        { href: "/admin/sellers", label: "Seller Admins" },
        { href: "/seller", label: "Seller Console" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}

import { requireAdmin } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <DashboardShell
      variant="admin"
      userName={session.user.name}
      userRole={session.user.role}
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

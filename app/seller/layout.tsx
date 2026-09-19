import { requireSeller } from "@/lib/auth-helpers";
import { getActingSeller, listSellersForAdminView } from "@/lib/seller-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AdminSellerSwitcher } from "@/components/seller/admin-seller-switcher";
import { isPlatformAdmin } from "@/lib/roles";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSeller();

  const acting = await getActingSeller();
  const sellers =
    isPlatformAdmin(session.user.role) ? await listSellersForAdminView() : [];

  return (
    <DashboardShell
      variant="seller"
      userName={
        acting?.isAdminView
          ? `${session.user.name} · ${acting.businessName}`
          : session.user.name
      }
      extraLinks={[
        { href: "/", label: "View Storefront" },
        ...(isPlatformAdmin(session.user.role)
          ? [{ href: "/admin", label: "Admin" }]
          : []),
      ]}
    >
      {acting?.isAdminView && sellers.length > 0 ? (
        <AdminSellerSwitcher
          key={acting.sellerUserId}
          sellers={sellers}
          currentSellerId={acting.sellerUserId}
        />
      ) : null}
      {children}
    </DashboardShell>
  );
}

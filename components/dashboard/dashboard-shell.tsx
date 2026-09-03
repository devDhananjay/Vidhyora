"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  FolderTree,
  ShoppingCart,
  Star,
  Tag,
  DollarSign,
  Settings,
  BarChart3,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Seller Admins", href: "/admin/sellers", icon: Store },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Payments", href: "/admin/payments", icon: DollarSign },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const SELLER_NAV = [
  { label: "Dashboard", href: "/seller", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Inventory", href: "/seller/inventory", icon: TrendingUp },
  { label: "Returns", href: "/seller/returns", icon: RotateCcw },
  { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
  { label: "Profile", href: "/seller/profile", icon: Store },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

export function DashboardShell({
  variant,
  userName,
  extraLinks,
  children,
}: {
  variant: "admin" | "seller";
  userName?: string | null;
  extraLinks?: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const items = variant === "admin" ? ADMIN_NAV : SELLER_NAV;
  const badge = variant === "admin" ? "Super Admin" : "Seller Admin";

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#2b1a16]">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-serif text-[28px] tracking-[0.12em] text-[#8b2e2e]"
            >
              {APP_NAME}
            </Link>
            <span className="rounded-full bg-[#8b2e2e]/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-[#8b2e2e] uppercase">
              {badge}
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm text-neutral-500">
            {extraLinks?.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-[#8b2e2e]"
              >
                {link.label}
              </Link>
            ))}
            {userName ? (
              <span className="hidden text-neutral-800 md:inline">{userName}</span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 border-r border-neutral-100 bg-white lg:block">
          <nav className="space-y-1 p-4">
            {items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  item,
}: {
  item: (typeof ADMIN_NAV)[number];
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const root = item.href === "/admin" || item.href === "/seller";
  const active = root
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-r-lg px-3 py-2.5 text-sm transition",
        active
          ? "bg-[#f6ebe8] font-medium text-[#8b2e2e] shadow-[inset_3px_0_0_#8b2e2e]"
          : "text-neutral-600 hover:bg-[#faf7f5] hover:text-[#8b2e2e]",
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} />
      {item.label}
    </Link>
  );
}

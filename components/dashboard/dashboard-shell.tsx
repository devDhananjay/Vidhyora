"use client";

import { useEffect, useState } from "react";
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
  Wallet,
  MapPin,
  CircleHelp,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/brand-logo";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Seller Admins", href: "/admin/sellers", icon: Store },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: TrendingUp },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Returns", href: "/admin/returns", icon: RotateCcw },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Payments", href: "/admin/payments", icon: DollarSign },
  { label: "Payouts", href: "/admin/payouts", icon: Wallet },
  { label: "Stores", href: "/admin/stores", icon: MapPin },
  { label: "Help", href: "/admin/help", icon: CircleHelp },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const SELLER_NAV = [
  { label: "Dashboard", href: "/seller", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Inventory", href: "/seller/inventory", icon: TrendingUp },
  { label: "Returns", href: "/seller/returns", icon: RotateCcw },
  { label: "Payments", href: "/seller/payments", icon: Wallet },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#2b1a16]">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full text-[#8b2e2e] hover:bg-[#8b2e2e]/5 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Link href="/" className="shrink-0" aria-label="VIDYORA home">
              <BrandLogo size="sm" priority className="h-10 w-10 sm:h-12 sm:w-12" />
            </Link>
            <span className="truncate rounded-full bg-[#8b2e2e]/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-[#8b2e2e] uppercase">
              {badge}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-500 sm:gap-5">
            {extraLinks?.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden hover:text-[#8b2e2e] sm:inline"
              >
                {link.label}
              </Link>
            ))}
            {userName ? (
              <span className="hidden max-w-[140px] truncate text-neutral-800 md:inline">
                {userName}
              </span>
            ) : null}
          </div>
        </div>

        {/* Mobile quick links strip */}
        <div className="border-t border-neutral-100 lg:hidden">
          <div className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.slice(0, 6).map((item) => (
              <NavLink key={item.href} item={item} compact />
            ))}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,20rem)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">{badge}</p>
                {userName ? (
                  <p className="text-xs text-neutral-500">{userName}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </nav>
            {extraLinks?.length ? (
              <div className="space-y-1 border-t border-neutral-100 p-3">
                {extraLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-[#faf7f5] hover:text-[#8b2e2e]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 border-r border-neutral-100 bg-white lg:block">
          <nav className="space-y-1 p-4">
            {items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  compact = false,
  onNavigate,
}: {
  item: (typeof ADMIN_NAV)[number];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const root = item.href === "/admin" || item.href === "/seller";
  const active = root
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (compact) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] whitespace-nowrap transition",
          active
            ? "bg-[#8b2e2e] text-white"
            : "bg-[#f6ebe8] text-[#8b2e2e]",
        )}
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
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

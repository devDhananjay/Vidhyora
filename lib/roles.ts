import type { UserRole } from "@prisma/client";

/** Platform operators who can see everyone and moderate listings. */
export function isSuperAdmin(role?: UserRole | string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

/** Store owners who manage only their own catalogue and orders. */
export function isSellerAdmin(role?: UserRole | string | null): boolean {
  return role === "SELLER";
}

export function roleLabel(role?: UserRole | string | null): string {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return "Super Admin";
  if (role === "SELLER") return "Seller Admin";
  return "Customer";
}

export function dashboardPath(role?: UserRole | string | null): string {
  if (isSuperAdmin(role)) return "/admin";
  if (isSellerAdmin(role)) return "/seller";
  return "/";
}

export function roleBadgeClass(role?: UserRole | string | null): string {
  if (isSuperAdmin(role)) return "bg-red-700 text-white";
  if (isSellerAdmin(role)) return "bg-blue-600 text-white";
  return "";
}

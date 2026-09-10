import type { UserRole } from "@prisma/client";

/** True Super Admin only — sensitive CMS / role assignment. */
export function isSuperAdmin(role?: UserRole | string | null): boolean {
  return role === "SUPER_ADMIN";
}

/** Platform operators (ADMIN or SUPER_ADMIN) who can moderate the marketplace. */
export function isPlatformAdmin(role?: UserRole | string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** Store owners who manage only their own catalogue and orders. */
export function isSellerAdmin(role?: UserRole | string | null): boolean {
  return role === "SELLER";
}

export function roleLabel(role?: UserRole | string | null): string {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "ADMIN") return "Admin";
  if (role === "SELLER") return "Seller Admin";
  return "Customer";
}

export function dashboardPath(role?: UserRole | string | null): string {
  if (isPlatformAdmin(role)) return "/admin";
  if (isSellerAdmin(role)) return "/seller";
  return "/";
}

export function roleBadgeClass(role?: UserRole | string | null): string {
  if (isPlatformAdmin(role)) return "bg-red-700 text-white";
  if (isSellerAdmin(role)) return "bg-blue-600 text-white";
  return "";
}

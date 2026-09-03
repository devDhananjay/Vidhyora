import type { UserRole } from "@prisma/client";

export type Permission =
  | "product:read"
  | "product:create"
  | "product:update"
  | "product:delete"
  | "product:approve"
  | "order:read"
  | "order:manage"
  | "seller:read"
  | "seller:manage"
  | "category:manage"
  | "coupon:manage"
  | "review:moderate"
  | "admin:access"
  | "seller:access";

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  "product:read",
  "product:create",
  "product:update",
  "product:delete",
  "product:approve",
  "order:read",
  "order:manage",
  "seller:read",
  "seller:manage",
  "category:manage",
  "coupon:manage",
  "review:moderate",
  "admin:access",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CUSTOMER: ["product:read", "order:read"],
  SELLER: [
    "product:read",
    "product:create",
    "product:update",
    "order:read",
    "order:manage",
    "seller:access",
  ],
  ADMIN: SUPER_ADMIN_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

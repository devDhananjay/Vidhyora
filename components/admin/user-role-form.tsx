"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { UserRole } from "@prisma/client";
import { updateUserRole } from "@/actions/admin/manage-users";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { roleLabel } from "@/lib/roles";

const ROLE_OPTIONS: UserRole[] = [
  "CUSTOMER",
  "SELLER",
  "ADMIN",
  "SUPER_ADMIN",
];

export function UserRoleForm({
  userId,
  currentRole,
  canAssignAdminRoles,
}: {
  userId: string;
  currentRole: UserRole;
  canAssignAdminRoles: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const options = canAssignAdminRoles
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((item) => item === "CUSTOMER" || item === "SELLER");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, { role });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRole(result.data.role);
      setMessage(`Role updated to ${roleLabel(result.data.role)}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="admin-user-role">Role</Label>
        <select
          id="admin-user-role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="h-10 w-full appearance-none rounded-full border border-neutral-200 bg-white px-4 pr-9 text-sm outline-none focus:border-[#8b2e2e]"
        >
          {options.map((item) => (
            <option key={item} value={item}>
              {roleLabel(item)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Changing role updates dashboard access immediately after next login.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending || role === currentRole}
        className="rounded-full px-6"
      >
        {isPending ? "Updating…" : "Update role"}
      </Button>
    </form>
  );
}

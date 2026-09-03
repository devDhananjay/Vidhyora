"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setUserActive } from "@/actions/admin/manage-users";
import { Ban, CheckCircle } from "lucide-react";
import { isSuperAdmin } from "@/lib/roles";

export function UserStatusActions({
  userId,
  isActive,
  role,
}: {
  userId: string;
  isActive: boolean;
  role: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (isSuperAdmin(role)) {
    return null;
  }

  const toggle = () => {
    startTransition(async () => {
      const result = await setUserActive(userId, !isActive);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={
        isActive
          ? "gap-2 bg-amber-600 text-white hover:bg-amber-700"
          : "gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
      }
    >
      {isActive ? (
        <>
          <Ban className="size-4" />
          Deactivate
        </>
      ) : (
        <>
          <CheckCircle className="size-4" />
          Activate
        </>
      )}
    </Button>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle } from "lucide-react";
import { setUserActive } from "@/actions/admin/manage-users";
import { Button } from "@/components/ui/button";
import { isPlatformAdmin } from "@/lib/roles";
import { appAlert } from "@/components/shared/app-dialog";

export function UserStatusActions({
  userId,
  isActive,
  role,
}: {
  userId: string;
  isActive: boolean;
  role: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (isPlatformAdmin(role)) {
    return (
      <p className="text-sm text-muted-foreground">
        Super Admin accounts stay active from this screen.
      </p>
    );
  }

  function toggle() {
    startTransition(async () => {
      const result = await setUserActive(userId, !isActive);
      if (!result.success) {
        await appAlert(result.error, { variant: "error" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={
        isActive
          ? "gap-2 rounded-full bg-amber-600 text-white hover:bg-amber-700"
          : "gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
      }
    >
      {isActive ? (
        <>
          <Ban className="size-4" />
          Disable account
        </>
      ) : (
        <>
          <CheckCircle className="size-4" />
          Enable account
        </>
      )}
    </Button>
  );
}

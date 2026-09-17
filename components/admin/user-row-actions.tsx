"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Ban, CheckCircle, Eye } from "lucide-react";
import Link from "next/link";
import { setUserActive } from "@/actions/admin/manage-users";
import { Button } from "@/components/ui/button";
import { isPlatformAdmin } from "@/lib/roles";
import { appAlert } from "@/components/shared/app-dialog";

export function UserRowActions({
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

  function toggle() {
    if (isPlatformAdmin(role)) return;
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
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm" className="rounded-full">
        <Link href={`/admin/users/${userId}`}>
          <Eye className="mr-1.5 size-3.5" />
          View
        </Link>
      </Button>
      {!isPlatformAdmin(role) ? (
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={toggle}
          className={
            isActive
              ? "rounded-full bg-amber-600 text-white hover:bg-amber-700"
              : "rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          }
        >
          {isActive ? (
            <>
              <Ban className="mr-1.5 size-3.5" />
              Disable
            </>
          ) : (
            <>
              <CheckCircle className="mr-1.5 size-3.5" />
              Enable
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}

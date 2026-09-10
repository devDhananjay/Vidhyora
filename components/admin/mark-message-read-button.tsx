"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markContactMessageRead } from "@/actions/content/submit-contact";
import { Button } from "@/components/ui/button";

export function MarkMessageReadButton({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status === "READ") {
    return (
      <span className="text-xs tracking-wide text-muted-foreground uppercase">
        Read
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="rounded-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markContactMessageRead(id);
          router.refresh();
        })
      }
    >
      {isPending ? "..." : "Mark read"}
    </Button>
  );
}

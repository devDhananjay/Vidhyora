"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveContactMessage,
  deleteContactMessage,
  markContactMessageRead,
} from "@/actions/content/submit-contact";
import { Button } from "@/components/ui/button";

export function ContactMessageActions({
  id,
  status,
  email,
  subject,
}: {
  id: string;
  status: string;
  email: string;
  subject: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline" className="rounded-full">
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`}
        >
          Reply
        </a>
      </Button>
      {status === "NEW" ? (
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
          Mark read
        </Button>
      ) : null}
      {status !== "ARCHIVED" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await archiveContactMessage(id);
              router.refresh();
            })
          }
        >
          Archive
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full border-red-200 text-red-700"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Delete this message permanently?")) return;
          startTransition(async () => {
            await deleteContactMessage(id);
            router.refresh();
          });
        }}
      >
        Delete
      </Button>
    </div>
  );
}

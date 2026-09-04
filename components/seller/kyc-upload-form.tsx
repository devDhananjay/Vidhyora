"use client";

import { useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { uploadKycDocument } from "@/actions/seller/upload-kyc";

export function KycUploadForm({
  kind,
  label,
  currentUrl,
}: {
  kind: "gst" | "pan";
  label: string;
  currentUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await uploadKycDocument(formData);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input type="hidden" name="kind" value={kind} />
      <div className="text-sm font-medium">{label}</div>
      {currentUrl ? (
        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="block text-sm text-primary hover:underline"
        >
          View uploaded file
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">No file yet</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="text-sm"
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Uploading..." : currentUrl ? "Replace" : "Upload"}
        </Button>
      </div>
    </form>
  );
}

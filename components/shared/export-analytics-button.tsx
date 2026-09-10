"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportAnalyticsButtonProps = {
  label?: string;
  exportAction: () => Promise<
    | { success: true; data: { csv: string; filename: string } }
    | { success: false; error: string }
  >;
};

export function ExportAnalyticsButton({
  label = "Export CSV (90 days)",
  exportAction,
}: ExportAnalyticsButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await exportAction();
      if (!result.success) {
        alert(result.error);
        return;
      }
      const blob = new Blob([result.data.csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.data.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="gap-2"
    >
      <Download className="size-4" strokeWidth={1.75} />
      {pending ? "Exporting…" : label}
    </Button>
  );
}

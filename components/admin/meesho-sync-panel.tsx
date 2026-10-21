"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  buildMeeshoCsvForCategory,
  markMeeshoListingsLive,
  markMeeshoListingsUploaded,
  rebuildMeeshoListing,
  syncApprovedProductsToMeeshoQueue,
  type MeeshoListingRow,
} from "@/actions/admin/manage-meesho-listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  READY: "bg-emerald-100 text-emerald-900",
  PENDING: "bg-amber-100 text-amber-900",
  UPLOADED: "bg-sky-100 text-sky-900",
  LIVE: "bg-violet-100 text-violet-900",
  FAILED: "bg-red-100 text-red-900",
  SKIPPED: "bg-stone-100 text-stone-700",
};

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MeeshoSyncPanel({
  listings,
  stats,
}: {
  listings: MeeshoListingRow[];
  stats: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [catalogId, setCatalogId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const row of listings) {
      if (row.meeshoCategory && (row.status === "READY" || row.status === "PENDING")) {
        set.add(row.meeshoCategory);
      }
    }
    return [...set].sort();
  }, [listings]);

  function run(label: string, fn: () => Promise<{ success: boolean; error?: string; data?: unknown }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setMessage(result.error || `${label} failed`);
        return;
      }
      setMessage(`${label} done`);
      setSelected({});
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl font-normal text-brand">
            How this works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Jab product website pe <strong>APPROVED / ACTIVE</strong> hota hai,
            system automatically Meesho-ready row queue mein daal deta hai
            (QC-safe name, description, diameter, Brand blank, prices).
          </p>
          <p>
            Meesho ka official catalog-create API public nahi hai — isliye abhi
            flow: <strong>Download CSV → Meesho Bulk Upload</strong> → yahan
            mark Uploaded / Live. Partner API credentials milne pe full auto
            push add kar sakte hain.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(
              [
                "READY",
                "PENDING",
                "UPLOADED",
                "LIVE",
                "FAILED",
                "SKIPPED",
              ] as const
            ).map((status) => (
              <Badge
                key={status}
                variant="secondary"
                className={cn("rounded-md", STATUS_TONE[status])}
              >
                {status}: {stats[status] || 0}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-3">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run("Queue sync", async () => syncApprovedProductsToMeeshoQueue())
          }
        >
          Sync approved products into queue
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(`CSV ${category}`, async () => {
                const result = await buildMeeshoCsvForCategory(category);
                if (result.success && result.data) {
                  downloadTextFile(
                    result.data.filename,
                    result.data.csv,
                    "text/csv;charset=utf-8",
                  );
                  setMessage(
                    `${result.data.count} rows downloaded for ${category}. Paste into Meesho template / upload.`,
                  );
                }
                return result;
              })
            }
          >
            Download {category} CSV
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">
            Meesho Catalog ID (optional)
          </label>
          <Input
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
            placeholder="e.g. 602565971"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={pending || selectedIds.length === 0}
          onClick={() =>
            run("Mark uploaded", async () =>
              markMeeshoListingsUploaded(selectedIds, catalogId),
            )
          }
        >
          Mark uploaded ({selectedIds.length})
        </Button>
        <Button
          type="button"
          disabled={pending || selectedIds.length === 0}
          onClick={() =>
            run("Mark live", async () =>
              markMeeshoListingsLive(selectedIds, catalogId),
            )
          }
        >
          Mark live ({selectedIds.length})
        </Button>
      </div>

      {message ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{message}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl font-normal text-brand">
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    onChange={(e) => {
                      const next: Record<string, boolean> = {};
                      if (e.target.checked) {
                        for (const row of listings) next[row.id] = true;
                      }
                      setSelected(next);
                    }}
                  />
                </th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Meesho cat</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Group</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="py-3 pr-2">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[row.id])}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          [row.id]: e.target.checked,
                        }))
                      }
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <Link
                      href={`/admin/products/${row.productId}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {row.productName}
                    </Link>
                    {row.errorMessage ? (
                      <p className="mt-1 text-xs text-red-700">{row.errorMessage}</p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs">{row.sku}</td>
                  <td className="py-3 pr-3">{row.meeshoCategory || "—"}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        STATUS_TONE[row.status] || "bg-muted",
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs">
                    {row.groupId || "—"}
                  </td>
                  <td className="py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        run("Rebuild", async () =>
                          rebuildMeeshoListing(row.productId),
                        )
                      }
                    >
                      Rebuild
                    </Button>
                  </td>
                </tr>
              ))}
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Queue empty. Approve a product or click “Sync approved products”.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

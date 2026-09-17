"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function AnalyticsDateRange({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  const apply = (nextFrom: string, nextTo: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const nextFrom = toIsoDate(start);
    const nextTo = toIsoDate(end);
    setLocalFrom(nextFrom);
    setLocalTo(nextTo);
    apply(nextFrom, nextTo);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => applyPreset(p.days)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="h-9 w-[150px]"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="h-9 w-[150px]"
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => apply(localFrom, localTo)}
          className="bg-[#8b2e2e] hover:bg-[#6f2424]"
        >
          {isPending ? "…" : "Apply"}
        </Button>
      </div>
    </div>
  );
}

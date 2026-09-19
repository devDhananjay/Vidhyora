"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/seller/stat-card";
import {
  ReturnModerationCard,
  type ReturnRequestCardData,
} from "@/components/returns/return-moderation-card";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "PICKED_UP", label: "Picked up" },
  { id: "COMPLETED", label: "Completed" },
  { id: "REJECTED", label: "Rejected" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function ReturnsWorkspace({
  items,
  showSeller,
  emptyMessage,
}: {
  items: ReturnRequestCardData[];
  showSeller?: boolean;
  emptyMessage: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get("status") || "all";
  const active: FilterId = FILTERS.some((f) => f.id === raw)
    ? (raw as FilterId)
    : "all";

  const counts = useMemo(() => {
    const base = {
      all: items.length,
      PENDING: 0,
      APPROVED: 0,
      PICKED_UP: 0,
      COMPLETED: 0,
      REJECTED: 0,
    };
    for (const item of items) {
      if (item.status in base) {
        base[item.status as keyof typeof base] += 1;
      }
    }
    return base;
  }, [items]);

  const filtered =
    active === "all" ? items : items.filter((item) => item.status === active);

  const setFilter = (id: FilterId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") params.delete("status");
    else params.set("status", id);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total requests"
          value={counts.all}
          icon={RotateCcw}
          description="Returns & replacements"
        />
        <StatCard
          title="Pending"
          value={counts.PENDING}
          icon={Clock3}
          description="Awaiting review"
        />
        <StatCard
          title="In progress"
          value={counts.APPROVED + counts.PICKED_UP}
          icon={PackageCheck}
          description="Approved or picked up"
        />
        <StatCard
          title="Closed"
          value={counts.COMPLETED + counts.REJECTED}
          icon={counts.REJECTED > 0 ? XCircle : CheckCircle2}
          description={`${counts.COMPLETED} done · ${counts.REJECTED} rejected`}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((filter) => {
          const count = counts[filter.id];
          const isActive = active === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setFilter(filter.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
                isActive
                  ? "border-[#8b2e2e] bg-[#8b2e2e] text-white shadow-sm"
                  : "border-[#ead9c4] bg-white text-neutral-700 hover:border-[#d4b896] hover:bg-[#faf6f0]",
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-serif text-xs tabular-nums",
                  isActive ? "bg-white/20 text-white" : "bg-[#f6ead7] text-[#8b2e2e]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-[#ead9c4] bg-[#faf7f5]/60">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#f6ead7] text-[#8b2e2e]">
              <RotateCcw className="size-5" strokeWidth={1.5} />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
            {active !== "all" ? (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="text-sm font-medium text-[#8b2e2e] hover:underline"
              >
                Show all requests
              </button>
            ) : (
              <Link
                href={pathname.startsWith("/admin") ? "/admin/orders" : "/seller/orders"}
                className="text-sm font-medium text-[#8b2e2e] hover:underline"
              >
                Back to orders
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <ReturnModerationCard
              key={item.id}
              item={item}
              showSeller={showSeller}
            />
          ))}
        </div>
      )}
    </div>
  );
}

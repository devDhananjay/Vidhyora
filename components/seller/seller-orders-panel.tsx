"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OrdersSearch } from "@/components/orders/orders-search";
import { SellerFulfillmentActions } from "@/components/seller/seller-fulfillment-actions";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel, getNextFulfillmentStep } from "@/lib/orders/order-utils";
import { bulkAdvanceFulfillment } from "@/actions/seller/bulk-fulfillment";
import { appAlert } from "@/components/shared/app-dialog";
import { Package, Printer } from "lucide-react";

export type SellerOrderListItem = {
  id: string;
  quantity: number;
  total: number | string;
  order: {
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string | Date;
    user: {
      name: string | null;
      email: string;
    };
    payments: Array<{ provider: string }>;
  };
  product: {
    name: string;
    thumbnail: string | null;
    slug: string;
  };
  variant: {
    sku: string;
    attributes: unknown;
  };
};

type SellerOrdersPanelProps = {
  items: SellerOrderListItem[];
  preferredCourier?: string;
};

export function SellerOrdersPanel({
  items,
  preferredCourier = "",
}: SellerOrdersPanelProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const selectedIds = Object.entries(selected)
    .filter(([, on]) => on)
    .map(([id]) => id);

  const searchable = items.map((item) => ({
    ...item,
    searchText: [
      item.order.orderNumber,
      item.product.name,
      item.order.user.name,
      item.order.user.email,
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const commonNext = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    const steps = selectedItems.map((i) =>
      getNextFulfillmentStep(i.order.orderStatus),
    );
    if (steps.some((s) => !s)) return null;
    const first = steps[0]!.nextStatus;
    if (steps.every((s) => s!.nextStatus === first) && first !== "SHIPPED") {
      return { status: first, label: steps[0]!.label };
    }
    return null;
  }, [selectedIds, items]);

  const toggleAll = (filtered: SellerOrderListItem[], on: boolean) => {
    const next: Record<string, boolean> = { ...selected };
    for (const item of filtered) {
      if (on) next[item.id] = true;
      else delete next[item.id];
    }
    setSelected(next);
  };

  const handleBulk = () => {
    if (!commonNext) return;
    startTransition(async () => {
      const result = await bulkAdvanceFulfillment(
        selectedIds,
        commonNext.status as any,
      );
      if (result.success) {
        setSelected({});
        await appAlert(
          `Updated ${result.data.updated} order(s)${
            result.data.failed.length
              ? `. Skipped: ${result.data.failed.join(", ")}`
              : ""
          }.`,
          { variant: "success" },
        );
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const packingHref =
    selectedIds.length > 0
      ? `/seller/orders/packing-slip?ids=${selectedIds.join(",")}`
      : "#";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[#e8d5d0] bg-[#faf7f5] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">
          {selectedIds.length} order(s) selected
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedIds.length === 0}
            asChild={selectedIds.length > 0}
            className="gap-1.5"
          >
            {selectedIds.length > 0 ? (
              <Link href={packingHref} target="_blank">
                <Printer className="size-3.5" />
                Packing slips
              </Link>
            ) : (
              <>
                <Printer className="size-3.5" />
                Packing slips
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!commonNext || isPending}
            onClick={handleBulk}
            className="bg-[#8b2e2e] hover:bg-[#6f2424]"
          >
            <Package className="mr-1.5 size-3.5" />
            {commonNext
              ? isPending
                ? "Updating…"
                : `Bulk: ${commonNext.label}`
              : "Bulk fulfill"}
          </Button>
        </div>
      </div>

      <OrdersSearch
        items={searchable}
        placeholder="Search by order number, product or customer…"
      >
        {(filtered) => (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={
                  filtered.length > 0 &&
                  filtered.every((i) => selected[i.id])
                }
                onCheckedChange={(v) => toggleAll(filtered, Boolean(v))}
                id="select-all-orders"
              />
              <label htmlFor="select-all-orders" className="text-sm">
                Select all in view
              </label>
            </div>
            <div className="grid gap-4">
              {filtered.map((item) => {
                const attributes =
                  item.variant.attributes &&
                  typeof item.variant.attributes === "object" &&
                  !Array.isArray(item.variant.attributes)
                    ? (item.variant.attributes as Record<string, string>)
                    : null;

                return (
                  <Card key={item.id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={Boolean(selected[item.id])}
                            onCheckedChange={(v) =>
                              setSelected((prev) => ({
                                ...prev,
                                [item.id]: Boolean(v),
                              }))
                            }
                            className="mt-1"
                          />
                          <div className="relative size-20 shrink-0 overflow-hidden rounded">
                            {item.product.thumbnail ? (
                              <Image
                                src={item.product.thumbnail}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-muted">
                                📦
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <Link
                                href={`/seller/orders/${item.id}`}
                                className="font-semibold hover:text-primary"
                              >
                                {item.order.orderNumber}
                              </Link>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.product.name}
                                {attributes
                                  ? ` · ${Object.values(attributes).join(" / ")}`
                                  : ""}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.order.user.name} •{" "}
                                {format(
                                  new Date(item.order.createdAt),
                                  "MMM dd, yyyy",
                                )}{" "}
                                • Qty {item.quantity}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">
                                {getOrderStatusLabel(item.order.orderStatus)}
                              </Badge>
                              <PaymentStatusBadge
                                status={item.order.paymentStatus}
                              />
                              <Badge variant="outline">
                                {formatCurrency(Number(item.total))}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <SellerFulfillmentActions
                              orderItemId={item.id}
                              currentStatus={item.order.orderStatus}
                              preferredCourier={preferredCourier}
                            />
                            <Link
                              href={`/seller/orders/packing-slip?ids=${item.id}`}
                              target="_blank"
                              className="text-sm text-primary hover:underline"
                            >
                              Packing slip
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </OrdersSearch>
    </div>
  );
}

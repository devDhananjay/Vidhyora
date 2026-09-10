"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  bulkApproveProducts,
  bulkRejectProducts,
} from "@/actions/admin/manage-products";
import { ProductActions } from "@/components/admin/product-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  thumbnail: string | null;
  status: string;
  approvalStatus: string;
  createdAt: Date | string;
  basePrice: unknown;
  category: { name: string };
  seller: { seller: { name: string | null } };
  variants: { stock: number; price: unknown }[];
};

function getApprovalBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return <Badge className="bg-green-600">Approved</Badge>;
    case "PENDING_APPROVAL":
      return <Badge className="bg-yellow-600">Pending</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    case "DRAFT":
      return <Badge className="bg-yellow-600">Draft — needs review</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function isPendingStatus(status: string) {
  return status === "PENDING_APPROVAL" || status === "DRAFT";
}

export function ProductBulkActions({ products }: { products: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const pendingIds = useMemo(
    () => products.filter((p) => isPendingStatus(p.approvalStatus)).map((p) => p.id),
    [products],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllPending() {
    setSelected((prev) => {
      if (pendingIds.every((id) => prev.has(id))) return new Set();
      return new Set(pendingIds);
    });
  }

  function runApprove() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setMessage(null);
    startTransition(async () => {
      const result = await bulkApproveProducts(ids);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(`Approved ${result.data.count} product(s).`);
      setSelected(new Set());
    });
  }

  function runReject() {
    const ids = [...selected];
    if (ids.length === 0) return;
    const reason = window.prompt("Rejection reason for selected products:");
    if (!reason?.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await bulkRejectProducts(ids, reason.trim());
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(`Rejected ${result.data.count} product(s).`);
      setSelected(new Set());
    });
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No products found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={
                pendingIds.length > 0 &&
                pendingIds.every((id) => selected.has(id))
              }
              onChange={toggleAllPending}
              className="size-4 rounded border-neutral-300 accent-[#8b2e2e]"
            />
            Select all pending
          </label>
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <Button
            type="button"
            size="sm"
            disabled={selected.size === 0 || isPending}
            onClick={runApprove}
          >
            Approve selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selected.size === 0 || isPending}
            onClick={runReject}
          >
            Reject selected
          </Button>
          {message ? (
            <span className="text-sm text-muted-foreground">{message}</span>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4">
        {products.map((product) => {
          const totalStock = product.variants.reduce(
            (acc, v) => acc + v.stock,
            0,
          );
          const minPrice = product.variants.length
            ? Math.min(...product.variants.map((v) => Number(v.price)))
            : Number(product.basePrice);
          const canSelect = isPendingStatus(product.approvalStatus);

          return (
            <Card key={product.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {canSelect ? (
                    <label className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggle(product.id)}
                        className="size-4 rounded border-neutral-300 accent-[#8b2e2e]"
                        aria-label={`Select ${product.name}`}
                      />
                    </label>
                  ) : (
                    <div className="hidden w-4 sm:block" />
                  )}

                  <div className="relative size-24 shrink-0 overflow-hidden rounded">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted text-3xl">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-lg font-semibold hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                          <span>{product.category.name}</span>
                          <span>•</span>
                          <span>{product.brand}</span>
                          <span>•</span>
                          <span>
                            Seller: {product.seller.seller.name ?? "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {getApprovalBadge(product.approvalStatus)}
                        <Badge
                          variant="outline"
                          className={
                            product.status === "ACTIVE" ? "text-green-600" : ""
                          }
                        >
                          {product.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:gap-4">
                      <div>
                        <div className="text-muted-foreground">Price</div>
                        <div className="font-semibold">
                          {formatCurrency(minPrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Stock</div>
                        <div
                          className={`font-semibold ${
                            totalStock <= 10 ? "text-red-600" : ""
                          }`}
                        >
                          {totalStock} units
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Variants</div>
                        <div className="font-semibold">
                          {product.variants.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Submitted</div>
                        <div className="font-semibold">
                          {format(new Date(product.createdAt), "MMM dd")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Review Product →
                      </Link>
                      <Link
                        href="/admin/inventory"
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        Override stock
                      </Link>
                      <ProductActions
                        productId={product.id}
                        currentStatus={product.approvalStatus}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

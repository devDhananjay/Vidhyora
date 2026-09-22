"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Package } from "lucide-react";
import { FilteredList } from "@/components/dashboard/filtered-list";
import { CloneProductButton } from "@/components/seller/clone-product-button";
import { SellerProductDeleteButton } from "@/components/seller/seller-product-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rejectionCategoryLabel } from "@/lib/products/jewellery-qa";
import { cn, formatCurrency } from "@/lib/utils";

export type SellerProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  thumbnail: string | null;
  status: string;
  approvalStatus: string;
  rejectionReason: string | null;
  rejectionCategory: string | null;
  resubmissionCount: number;
  categoryName: string;
  minPrice: number;
  totalStock: number;
  orderCount: number;
  reviewCount: number;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "APPROVED", label: "Approved" },
  { id: "PENDING_APPROVAL", label: "Pending" },
  { id: "REJECTED", label: "Rejected" },
  { id: "DRAFT", label: "Draft" },
  { id: "low_stock", label: "Low stock" },
];

function matchFilter(item: SellerProductRow, filterId: string) {
  if (filterId === "low_stock") return item.totalStock > 0 && item.totalStock <= 10;
  if (filterId === "DRAFT") {
    return item.approvalStatus === "DRAFT" || item.status === "DRAFT";
  }
  return item.approvalStatus === filterId;
}

function searchText(item: SellerProductRow) {
  return `${item.name} ${item.brand} ${item.categoryName} ${item.approvalStatus} ${item.status}`;
}

function approvalBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
          Approved
        </Badge>
      );
    case "PENDING_APPROVAL":
      return (
        <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
          Pending
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          Rejected
        </Badge>
      );
    case "SUSPENDED":
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge className="border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-100">
          Draft
        </Badge>
      );
  }
}

function statusBadge(status: string) {
  if (status === "ACTIVE") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 text-emerald-700"
      >
        Active
      </Badge>
    );
  }
  if (status === "INACTIVE") {
    return <Badge variant="outline">Inactive</Badge>;
  }
  return <Badge variant="outline">Draft</Badge>;
}

export function SellerProductsPanel({
  products,
}: {
  products: SellerProductRow[];
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#ead9c4] bg-[#faf7f5]/50 px-4 py-14 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#f6ead7] text-[#8b2e2e]">
          <Package className="size-6" strokeWidth={1.5} />
        </span>
        <h3 className="font-serif text-xl text-brand">No products yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Add your first listing. New products go live after Super Admin
          approval.
        </p>
        <Link href="/seller/products/new" className="mt-6 inline-flex">
          <Button className="bg-[#8b2e2e] hover:bg-[#6f2424]">
            Add your first product
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <FilteredList
      items={products}
      filters={FILTERS}
      matchFilter={matchFilter}
      searchText={searchText}
      searchPlaceholder="Search name, brand, category…"
      emptyLabel="No products in this filter."
    >
      {(filtered) => (
        <div className="grid gap-3">
          {filtered.map((product) => {
            const isRejected = product.approvalStatus === "REJECTED";
            const isLowStock =
              product.totalStock > 0 && product.totalStock <= 10;
            const isOut = product.totalStock === 0;

            return (
              <article
                key={product.id}
                className={cn(
                  "rounded-xl border bg-white p-4 transition hover:border-[#ead9c4] sm:p-5",
                  isRejected
                    ? "border-red-200 bg-red-50/30"
                    : "border-[#ead9c4]/80",
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={`/seller/products/${product.id}`}
                    className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-[#ead9c4]/60 bg-[#faf7f5] sm:size-28"
                  >
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-[#8b2e2e]/50">
                        <Package className="size-8" strokeWidth={1.25} />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/seller/products/${product.id}`}
                          className="font-serif text-xl text-brand transition hover:text-[#8b2e2e]"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {product.categoryName}
                          <span className="mx-1.5 text-[#ead9c4]">·</span>
                          {product.brand}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {approvalBadge(product.approvalStatus)}
                        {statusBadge(product.status)}
                      </div>
                    </div>

                    {isRejected && product.rejectionReason ? (
                      <div className="flex gap-2 rounded-lg border border-red-200 bg-white/90 p-3 text-sm text-red-800">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div>
                          <p className="font-medium">
                            Needs fixes
                            {product.rejectionCategory
                              ? ` · ${rejectionCategoryLabel(product.rejectionCategory)}`
                              : ""}
                          </p>
                          <p className="mt-0.5">{product.rejectionReason}</p>
                          <p className="mt-1 text-xs text-red-700/80">
                            Edit the listing, then submit again for approval.
                            {product.resubmissionCount
                              ? ` Previous resubmits: ${product.resubmissionCount}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#ead9c4]/50 bg-[#faf7f5]/60 px-3 py-2.5 sm:grid-cols-4">
                      <div>
                        <div className="text-[11px] tracking-wide text-neutral-500 uppercase">
                          Price
                        </div>
                        <div className="mt-0.5 font-serif text-lg text-brand tabular-nums">
                          {formatCurrency(product.minPrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] tracking-wide text-neutral-500 uppercase">
                          Stock
                        </div>
                        <div
                          className={cn(
                            "mt-0.5 font-serif text-lg tabular-nums",
                            isOut || isLowStock
                              ? "text-red-600"
                              : "text-brand",
                          )}
                        >
                          {product.totalStock}
                          <span className="ml-1 text-xs font-sans font-normal text-neutral-500">
                            units
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] tracking-wide text-neutral-500 uppercase">
                          Orders
                        </div>
                        <div className="mt-0.5 font-serif text-lg text-brand tabular-nums">
                          {product.orderCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] tracking-wide text-neutral-500 uppercase">
                          Reviews
                        </div>
                        <div className="mt-0.5 font-serif text-lg text-brand tabular-nums">
                          {product.reviewCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/seller/products/${product.id}/edit`}>
                        <Button
                          variant={isRejected ? "default" : "outline"}
                          size="sm"
                          className={
                            isRejected
                              ? "bg-[#8b2e2e] hover:bg-[#6f2424]"
                              : "border-[#ead9c4]"
                          }
                        >
                          {isRejected ? "Fix & resubmit" : "Edit"}
                        </Button>
                      </Link>
                      <CloneProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                      <Link href={`/products/${product.slug}`} target="_blank">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#ead9c4]"
                        >
                          View on store
                        </Button>
                      </Link>
                      <SellerProductDeleteButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </FilteredList>
  );
}

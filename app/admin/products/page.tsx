import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/actions/admin/manage-products";
import { ProductBulkActions } from "@/components/admin/product-bulk-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products | Super Admin",
};

const FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
] as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ approvalStatus?: string; search?: string }>;
}) {
  const params = await searchParams;
  const approvalStatus = params.approvalStatus || "ALL";
  const search = params.search?.trim() || undefined;

  const products = await getAllProducts({
    approvalStatus,
    search,
  });

  const pendingCount = products.filter(
    (p) =>
      p.approvalStatus === "PENDING_APPROVAL" || p.approvalStatus === "DRAFT",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Product Review
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {products.length} products shown
          {approvalStatus === "ALL"
            ? ` • ${pendingCount} pending Super Admin approval`
            : null}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const href =
              filter.value === "ALL"
                ? search
                  ? `/admin/products?search=${encodeURIComponent(search)}`
                  : "/admin/products"
                : `/admin/products?approvalStatus=${filter.value}${
                    search ? `&search=${encodeURIComponent(search)}` : ""
                  }`;
            const active = approvalStatus === filter.value;
            return (
              <Link
                key={filter.value}
                href={href}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  active
                    ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]/40",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <form className="flex gap-2" action="/admin/products" method="get">
          {approvalStatus !== "ALL" ? (
            <input type="hidden" name="approvalStatus" value={approvalStatus} />
          ) : null}
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search name or SKU"
            className="h-9 w-full rounded-xl border border-neutral-200 px-3 text-sm sm:w-64"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-neutral-900 px-3 text-sm text-white"
          >
            Search
          </button>
        </form>
      </div>

      <ProductBulkActions products={products} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Package,
  Plus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/seller/stat-card";
import {
  SellerProductsPanel,
  type SellerProductRow,
} from "@/components/seller/seller-products-panel";
import { getSellerProducts } from "@/actions/seller/get-products";

export const metadata: Metadata = {
  title: "My Products | Seller Dashboard",
};

export default async function SellerProductsPage() {
  const products = await getSellerProducts();

  const rows: SellerProductRow[] = products.map((product) => {
    const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
    const minPrice = product.variants.length
      ? Math.min(...product.variants.map((v) => Number(v.price)))
      : Number(product.basePrice);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      thumbnail: product.thumbnail,
      status: product.status,
      approvalStatus: product.approvalStatus,
      rejectionReason: product.rejectionReason,
      rejectionCategory: product.rejectionCategory,
      resubmissionCount: product.resubmissionCount,
      categoryName: product.category.name,
      minPrice,
      totalStock,
      orderCount: product._count.orderItems,
      reviewCount: product._count.reviews,
    };
  });

  const approved = rows.filter((p) => p.approvalStatus === "APPROVED").length;
  const pending = rows.filter(
    (p) => p.approvalStatus === "PENDING_APPROVAL",
  ).length;
  const rejected = rows.filter((p) => p.approvalStatus === "REJECTED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
            My Products
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Manage listings, stock, and approval status. New products go live
            after Super Admin review.
          </p>
        </div>
        <Link href="/seller/products/new" className="self-start">
          <Button className="gap-2 bg-[#8b2e2e] hover:bg-[#6f2424]">
            <Plus className="size-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total products" value={rows.length} icon={Package} />
        <StatCard
          title="Approved"
          value={approved}
          icon={CheckCircle2}
          description="Live on store"
        />
        <StatCard
          title="Pending"
          value={pending}
          icon={Clock3}
          description="Awaiting review"
        />
        <StatCard
          title="Rejected"
          value={rejected}
          icon={XCircle}
          description="Needs fixes"
        />
      </div>

      <SellerProductsPanel products={rows} />
    </div>
  );
}

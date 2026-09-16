import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllCategories } from "@/actions/admin/manage-categories";
import { getSellerProduct } from "@/actions/seller/manage-products";
import { ProductForm } from "@/components/seller/product-form/product-form";

export const metadata: Metadata = {
  title: "Edit Product | Seller Dashboard",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getSellerProduct(id),
    getAllCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8b2e2e] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-neutral-900 sm:text-4xl">
          Edit Product
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Update your product information
        </p>
      </div>

      <ProductForm categories={categories} product={product} />
    </div>
  );
}

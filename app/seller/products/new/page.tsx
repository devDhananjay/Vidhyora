import type { Metadata } from "next";
import { getAllCategories } from "@/actions/admin/manage-categories";
import { ProductForm } from "@/components/seller/product-form/product-form";

export const metadata: Metadata = {
  title: "Add New Product | Seller Dashboard",
};

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Add New Product</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Create a new product listing for your store
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}

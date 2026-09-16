import type { Metadata } from "next";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/category-form";
import { getAllCategories } from "@/actions/admin/manage-categories";

export const metadata: Metadata = {
  title: "Create Category | Super Admin",
};

export default async function NewCategoryPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/categories"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Categories
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-neutral-900 sm:text-4xl">
          Create Category
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add a new product category to your store
        </p>
      </div>

      <CategoryForm categories={categories} />
    </div>
  );
}

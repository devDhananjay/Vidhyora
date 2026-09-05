import type { Metadata } from "next";
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
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Create Category</h1>
        <p className="mt-2 text-muted-foreground">
          Add a new product category to your store
        </p>
      </div>

      <CategoryForm categories={categories} />
    </div>
  );
}

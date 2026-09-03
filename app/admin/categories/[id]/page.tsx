import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { getAllCategories, getCategoryById } from "@/actions/admin/manage-categories";

export const metadata: Metadata = {
  title: "Edit Category | Super Admin",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, allCategories] = await Promise.all([
    getCategoryById(id),
    getAllCategories(),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Edit Category</h1>
        <p className="mt-2 text-muted-foreground">
          Update category information
        </p>
      </div>

      <CategoryForm
        category={category}
        categories={allCategories.filter((c) => c.id !== id)} // Exclude self from parent options
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryAttributesForm } from "@/components/admin/category-attributes-form";
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
        <Link
          href="/admin/categories"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Categories
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-neutral-900 sm:text-4xl">
          Edit Category
        </h1>
        <p className="mt-2 text-muted-foreground">
          Update category information
        </p>
      </div>

      <CategoryForm
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          parentId: category.parentId,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
          commissionPercentage:
            category.commissionPercentage === null ||
            category.commissionPercentage === undefined
              ? null
              : Number(category.commissionPercentage),
        }}
        categories={allCategories
          .filter((c) => c.id !== id)
          .map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            parentId: c.parentId,
          }))}
      />

      <CategoryAttributesForm
        categoryId={category.id}
        attributes={category.attributes}
      />
    </div>
  );
}

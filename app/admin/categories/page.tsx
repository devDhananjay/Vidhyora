import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllCategories } from "@/actions/admin/manage-categories";
import { Button } from "@/components/ui/button";
import { CategoryTreeBulk } from "@/components/admin/category-bulk-bar";

export const metadata: Metadata = {
  title: "Categories | Super Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
            Category Management
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <Link href="/admin/categories/new" className="self-start">
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Category
          </Button>
        </Link>
      </div>

      <CategoryTreeBulk categories={categories} />
    </div>
  );
}

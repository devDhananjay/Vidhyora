import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, FolderTree, Layers, Package, Plus } from "lucide-react";
import { getAllCategories } from "@/actions/admin/manage-categories";
import { CategoryTreeBulk } from "@/components/admin/category-bulk-bar";
import { StatCard } from "@/components/seller/stat-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Categories | Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();
  const roots = categories.filter((c) => !c.parentId);
  const active = categories.filter((c) => c.isActive);
  const hidden = categories.length - active.length;
  const withProducts = categories.filter((c) => c._count.products > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
            Category Management
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Organise the catalogue tree, visibility, and commission rates for
            storefront navigation.
          </p>
        </div>
        <Link href="/admin/categories/new" className="self-start">
          <Button className="gap-2 bg-brand hover:bg-brand/90">
            <Plus className="size-4" />
            Add Category
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total categories"
          value={categories.length}
          icon={FolderTree}
          description={`${roots.length} parent · ${categories.length - roots.length} sub`}
        />
        <StatCard
          title="Shown"
          value={active.length}
          icon={Layers}
          description="Visible on storefront"
        />
        <StatCard
          title="Hidden"
          value={hidden}
          icon={EyeOff}
          description="Not listed publicly"
        />
        <StatCard
          title="With products"
          value={withProducts}
          icon={Package}
          description="Have at least one listing"
        />
      </div>

      <CategoryTreeBulk categories={categories} />
    </div>
  );
}

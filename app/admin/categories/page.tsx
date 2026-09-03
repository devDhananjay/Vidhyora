import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllCategories } from "@/actions/admin/manage-categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryActions } from "@/components/admin/category-actions";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Categories | Super Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  // Organize into tree structure for display
  const rootCategories = categories.filter((c) => !c.parentId);
  const getCategoryChildren = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl text-neutral-900">Category Management</h1>
          <p className="mt-2 text-muted-foreground">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No categories yet. Create your first category to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rootCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              children={getCategoryChildren(category.id)}
              allCategories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  category,
  children,
  allCategories,
  level = 0,
}: {
  category: any;
  children: any[];
  allCategories: any[];
  level?: number;
}) {
  const hasChildren = children.length > 0;

  return (
    <div className={level > 0 ? "ml-8" : ""}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Category Image */}
            {category.image ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded bg-muted text-2xl">
                📁
              </div>
            )}

            {/* Category Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>/{category.slug}</span>
                    <span>•</span>
                    <span>{category._count.products} products</span>
                    {hasChildren && (
                      <>
                        <span>•</span>
                        <span>{children.length} subcategories</span>
                      </>
                    )}
                  </div>

                  {category.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  {category.parent && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Parent: {category.parent.name}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <CategoryActions categoryId={category.id} isActive={category.isActive} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child Categories */}
      {hasChildren && (
        <div className="mt-4 space-y-4">
          {children.map((child) => (
            <CategoryCard
              key={child.id}
              category={child}
              children={allCategories.filter((c) => c.parentId === child.id)}
              allCategories={allCategories}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

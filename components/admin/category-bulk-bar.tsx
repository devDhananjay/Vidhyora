"use client";

import { useMemo, useState, useTransition } from "react";
import { setCategoriesActive } from "@/actions/admin/manage-categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryActions } from "@/components/admin/category-actions";
import Image from "next/image";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  parentId: string | null;
  commissionPercentage: unknown;
  parent?: { id: string; name: string; slug: string } | null;
  _count: { products: number };
};

type CategoryTreeBulkProps = {
  categories: CategoryRow[];
};

export function CategoryTreeBulk({ categories }: CategoryTreeBulkProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  function getChildren(parentId: string) {
    return categories.filter((c) => c.parentId === parentId);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulk(isActive: boolean) {
    const ids = [...selected];
    if (ids.length === 0) return;
    setMessage(null);
    startTransition(async () => {
      const result = await setCategoriesActive(ids, isActive);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage(
        `${isActive ? "Shown" : "Hidden"} ${result.data.count} categor${
          result.data.count === 1 ? "y" : "ies"
        }.`,
      );
      setSelected(new Set());
    });
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No categories yet. Create your first category to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {selected.size} selected
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={selected.size === 0 || isPending}
          onClick={() => runBulk(true)}
        >
          Show selected
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={selected.size === 0 || isPending}
          onClick={() => runBulk(false)}
        >
          Hide selected
        </Button>
        {message ? (
          <span className="text-sm text-muted-foreground">{message}</span>
        ) : null}
      </div>

      {rootCategories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          children={getChildren(category.id)}
          allCategories={categories}
          selected={selected}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}

function CategoryCard({
  category,
  children,
  allCategories,
  selected,
  onToggle,
  level = 0,
}: {
  category: CategoryRow;
  children: CategoryRow[];
  allCategories: CategoryRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  level?: number;
}) {
  const hasChildren = children.length > 0;

  return (
    <div
      className={
        level > 0
          ? "ml-3 border-l border-neutral-200 pl-3 sm:ml-6 sm:pl-4 md:ml-8"
          : ""
      }
    >
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <label className="flex items-start pt-1">
              <input
                type="checkbox"
                checked={selected.has(category.id)}
                onChange={() => onToggle(category.id)}
                className="size-4 rounded border-neutral-300 accent-[#8b2e2e]"
                aria-label={`Select ${category.name}`}
              />
            </label>

            {category.image ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded sm:size-20">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded bg-muted text-2xl sm:size-20">
                📁
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {level > 0 ? (
                      <Badge variant="outline" className="text-xs">
                        Subcategory
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>/{category.slug}</span>
                    <span>•</span>
                    <span>{category._count.products} products</span>
                    {category.commissionPercentage != null && (
                      <>
                        <span>•</span>
                        <span>
                          {Number(category.commissionPercentage)}% commission
                        </span>
                      </>
                    )}
                    {hasChildren && (
                      <>
                        <span>•</span>
                        <span>{children.length} subcategories</span>
                      </>
                    )}
                  </div>

                  {category.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
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

                <CategoryActions
                  categoryId={category.id}
                  isActive={category.isActive}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChildren && (
        <div className="mt-4 space-y-4">
          {children.map((child) => (
            <CategoryCard
              key={child.id}
              category={child}
              children={allCategories.filter((c) => c.parentId === child.id)}
              allCategories={allCategories}
              selected={selected}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

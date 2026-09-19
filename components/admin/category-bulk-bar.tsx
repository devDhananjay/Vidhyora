"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, FolderTree, Package, Search } from "lucide-react";
import { setCategoriesActive } from "@/actions/admin/manage-categories";
import { CategoryActions } from "@/components/admin/category-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CategoryRow = {
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

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Shown" },
  { id: "hidden", label: "Hidden" },
  { id: "roots", label: "Parents" },
  { id: "subs", label: "Subcategories" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function CategoryTreeBulk({ categories }: CategoryTreeBulkProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryRow[]>();
    for (const c of categories) {
      if (!c.parentId) continue;
      const list = map.get(c.parentId) ?? [];
      list.push(c);
      map.set(c.parentId, list);
    }
    return map;
  }, [categories]);

  const counts = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId).length;
    const subs = categories.length - roots;
    const active = categories.filter((c) => c.isActive).length;
    return {
      all: categories.length,
      active,
      hidden: categories.length - active,
      roots,
      subs,
    };
  }, [categories]);

  const visibleIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return new Set(
      categories
        .filter((c) => {
          if (filter === "active" && !c.isActive) return false;
          if (filter === "hidden" && c.isActive) return false;
          if (filter === "roots" && c.parentId) return false;
          if (filter === "subs" && !c.parentId) return false;
          if (!q) return true;
          return (
            c.name.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q) ||
            (c.description ?? "").toLowerCase().includes(q) ||
            (c.parent?.name ?? "").toLowerCase().includes(q)
          );
        })
        .map((c) => c.id),
    );
  }, [categories, filter, query]);

  /** Roots to render: a root shows if it or any descendant matches. */
  const displayRoots = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    if (filter === "subs") {
      // When filtering to subs only, show matching subs grouped under parent label
      return roots.filter((root) => {
        const kids = childrenByParent.get(root.id) ?? [];
        return kids.some((k) => visibleIds.has(k.id));
      });
    }
    return roots.filter((root) => {
      if (visibleIds.has(root.id)) return true;
      const walk = (id: string): boolean => {
        const kids = childrenByParent.get(id) ?? [];
        return kids.some((k) => visibleIds.has(k.id) || walk(k.id));
      };
      return walk(root.id);
    });
  }, [categories, childrenByParent, visibleIds, filter]);

  function getChildren(parentId: string) {
    return (childrenByParent.get(parentId) ?? []).filter((c) => {
      if (filter === "roots") return false;
      if (!visibleIds.has(c.id)) {
        // Still show child branch if deeper descendants match
        const deeper = (childrenByParent.get(c.id) ?? []).some((d) =>
          visibleIds.has(d.id),
        );
        return deeper;
      }
      return true;
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible(on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (on) next.add(id);
        else next.delete(id);
      }
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
      <Card className="border-dashed border-[#ead9c4]">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#f6ead7] text-brand">
            <FolderTree className="size-5" strokeWidth={1.5} />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            No categories yet. Create your first category to organise the
            catalogue.
          </p>
          <Link href="/admin/categories/new">
            <Button className="bg-brand hover:bg-brand/90">Add Category</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            const count = counts[f.id];
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
                  isActive
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-[#ead9c4] bg-white text-neutral-700 hover:border-[#d4b896] hover:bg-[#faf6f0]",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-serif text-xs tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#f6ead7] text-brand",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, slug, parent…"
            className="rounded-full border-[#ead9c4] bg-white pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#ead9c4] bg-[#faf7f5]/60 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={
              visibleIds.size > 0 &&
              [...visibleIds].every((id) => selected.has(id))
            }
            onCheckedChange={(on) => selectVisible(Boolean(on))}
          />
          Select visible
        </label>
        <span className="text-sm text-muted-foreground">
          {selected.size} selected · {visibleIds.size} visible
        </span>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 border-[#ead9c4]"
            disabled={selected.size === 0 || isPending}
            onClick={() => runBulk(true)}
          >
            <Eye className="size-3.5" />
            Show
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 border-[#ead9c4]"
            disabled={selected.size === 0 || isPending}
            onClick={() => runBulk(false)}
          >
            <EyeOff className="size-3.5" />
            Hide
          </Button>
        </div>
        {message ? (
          <span className="w-full text-sm text-brand sm:w-auto">{message}</span>
        ) : null}
      </div>

      {displayRoots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ead9c4] bg-[#faf7f5]/50 px-4 py-12 text-center text-sm text-muted-foreground">
          {query.trim()
            ? `Nothing matched “${query.trim()}”.`
            : "No categories in this filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {displayRoots.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              children={getChildren(category.id)}
              childrenByParent={childrenByParent}
              visibleIds={visibleIds}
              filter={filter}
              selected={selected}
              onToggle={toggle}
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
  childrenByParent,
  visibleIds,
  filter,
  selected,
  onToggle,
  level = 0,
}: {
  category: CategoryRow;
  children: CategoryRow[];
  childrenByParent: Map<string, CategoryRow[]>;
  visibleIds: Set<string>;
  filter: FilterId;
  selected: Set<string>;
  onToggle: (id: string) => void;
  level?: number;
}) {
  const hasChildren = children.length > 0;
  const dimmed = !visibleIds.has(category.id) && hasChildren;

  return (
    <div
      className={cn(
        level > 0 &&
          "ml-2 border-l-2 border-[#ead9c4] pl-3 sm:ml-4 sm:pl-4 md:ml-6",
      )}
    >
      <Card
        className={cn(
          "border-[#ead9c4]/80 transition hover:border-[#d4b896]",
          !category.isActive && "opacity-80",
          dimmed && "opacity-60",
        )}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <label className="flex items-start pt-1">
              <Checkbox
                checked={selected.has(category.id)}
                onCheckedChange={() => onToggle(category.id)}
                aria-label={`Select ${category.name}`}
              />
            </label>

            {category.image ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f6ead7] sm:size-20">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#f6ead7] text-brand sm:size-20">
                <FolderTree className="size-6" strokeWidth={1.5} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/categories/${category.id}`}
                      className="font-serif text-lg text-neutral-900 hover:text-brand sm:text-xl"
                    >
                      {category.name}
                    </Link>
                    <Badge
                      className={
                        category.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
                          : "border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-100"
                      }
                    >
                      {category.isActive ? "Shown" : "Hidden"}
                    </Badge>
                    {level > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-[#ead9c4] bg-[#faf6f0] text-xs text-brand"
                      >
                        Subcategory
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-mono text-xs">/{category.slug}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Package className="size-3.5" />
                      <span className="font-serif text-base text-brand tabular-nums">
                        {category._count.products}
                      </span>{" "}
                      products
                    </span>
                    {category.commissionPercentage != null ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          {Number(category.commissionPercentage)}% commission
                        </span>
                      </>
                    ) : null}
                    {hasChildren ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          {children.length} subcategor
                          {children.length === 1 ? "y" : "ies"}
                        </span>
                      </>
                    ) : null}
                  </div>

                  {category.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}

                  {category.parent ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Under{" "}
                      <span className="font-medium text-neutral-700">
                        {category.parent.name}
                      </span>
                    </p>
                  ) : null}
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

      {hasChildren ? (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <CategoryCard
              key={child.id}
              category={child}
              children={(childrenByParent.get(child.id) ?? []).filter((c) => {
                if (filter === "roots") return false;
                if (!visibleIds.has(c.id)) {
                  const deeper = (childrenByParent.get(c.id) ?? []).some((d) =>
                    visibleIds.has(d.id),
                  );
                  return deeper;
                }
                return true;
              })}
              childrenByParent={childrenByParent}
              visibleIds={visibleIds}
              filter={filter}
              selected={selected}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

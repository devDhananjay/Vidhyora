import prisma from "@/lib/prisma";
import { FilterSection } from "@/components/products/filter-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";

type SearchParams = {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
};

export async function ProductFilters({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", approvalStatus: "APPROVED" },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
  ]);

  const selectedBrands = params.brand
    ? params.brand.split(',').filter(Boolean)
    : [];

  const hasFilters =
    params.category ||
    selectedBrands.length > 0 ||
    params.minPrice ||
    params.maxPrice;

  return (
    <div className="space-y-6 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products">
              <X className="mr-1 size-4" />
              Clear
            </Link>
          </Button>
        )}
      </div>

      <FilterSection title="Category">
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`block rounded px-3 py-2 text-sm transition-colors hover:bg-muted ${
                params.category === category.slug
                  ? "bg-primary/10 font-medium text-primary"
                  : ""
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brand">
        <div className="space-y-2">
          {brands.map((item) => {
            const isSelected = selectedBrands.includes(item.brand);
            const newBrands = isSelected
              ? selectedBrands.filter((b) => b !== item.brand)
              : [...selectedBrands, item.brand];

            const href =
              newBrands.length > 0
                ? `/products?brand=${newBrands.join(',')}}${params.category ? `&category=${params.category}` : ""}`
                : "/products";

            return (
              <Link
                key={item.brand}
                href={href}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  isSelected ? "bg-primary/10 font-medium text-primary" : ""
                }`}
              >
                <div
                  className={`size-4 rounded border ${
                    isSelected ? "bg-primary border-primary" : ""
                  }`}
                />
                {item.brand}
              </Link>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <form method="get" className="space-y-3">
          {params.category && (
            <input type="hidden" name="category" value={params.category} />
          )}
          {params.brand && (
            <input type="hidden" name="brand" value={params.brand} />
          )}
          <div className="flex gap-2">
            <input
              type="number"
              name="minPrice"
              placeholder="Min"
              defaultValue={params.minPrice}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="number"
              name="maxPrice"
              placeholder="Max"
              defaultValue={params.maxPrice}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <Button type="submit" size="sm" className="w-full">
            Apply
          </Button>
        </form>
      </FilterSection>
    </div>
  );
}

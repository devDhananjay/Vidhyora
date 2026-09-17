"use client";

import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ListFilter,
  X,
} from "lucide-react";
import {
  IconBangles,
  IconChain,
  IconCoin,
  IconDiamond,
  IconGift,
  IconGem,
  IconPerson,
  IconWedding,
} from "@/components/storefront/jewellery-icons";
import { NativeSelect } from "@/components/ui/native-select";
import {
  labelForPriceValue,
  type ProductFacets,
} from "@/lib/products/product-facets";
import { splitCsv, toggleCsv } from "@/lib/products/product-query";
import { cn } from "@/lib/utils";

const partnerBtnClass =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3.5 text-[12px] font-medium text-brand transition duration-500 hover:bg-brand hover:text-primary-foreground";

type FilterBarProps = {
  facets: ProductFacets;
  total: number;
};

type SectionId =
  | "price"
  | "type"
  | "brand"
  | "gender"
  | "karat"
  | "size"
  | "occasion"
  | "metal";

type IconComp = ComponentType<SVGProps<SVGSVGElement>>;

const SECTION_META: Array<{
  id: SectionId;
  label: string;
  Icon: IconComp;
  facetKey: keyof ProductFacets;
}> = [
  { id: "price", label: "Price", Icon: IconCoin, facetKey: "prices" },
  {
    id: "type",
    label: "Jewellery Type",
    Icon: IconDiamond,
    facetKey: "types",
  },
  { id: "brand", label: "Brand", Icon: IconGift, facetKey: "brands" },
  { id: "gender", label: "Gender", Icon: IconPerson, facetKey: "genders" },
  { id: "karat", label: "Karatage", Icon: IconBangles, facetKey: "karats" },
  { id: "size", label: "Size", Icon: IconChain, facetKey: "sizes" },
  {
    id: "occasion",
    label: "Occasion",
    Icon: IconWedding,
    facetKey: "occasions",
  },
  { id: "metal", label: "Metal", Icon: IconGem, facetKey: "metals" },
];

const FILTER_KEYS = [
  "price",
  "minPrice",
  "maxPrice",
  "brand",
  "type",
  "gender",
  "karat",
  "size",
  "metal",
  "occasion",
] as const;

function legacyPrice(minPrice: string, maxPrice: string) {
  return minPrice && maxPrice ? `${minPrice}-${maxPrice}` : "";
}

export function TanishqFilterBar({ facets, total }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const sections = useMemo(
    () =>
      SECTION_META.filter((section) => facets[section.facetKey].length > 0),
    [facets],
  );

  const [expanded, setExpanded] = useState<string>(
    sections[0]?.id ?? "price",
  );

  const current = useMemo(() => {
    const minPrice = searchParams.get("minPrice") ?? "";
    const maxPrice = searchParams.get("maxPrice") ?? "";
    return {
      price: searchParams.get("price") || legacyPrice(minPrice, maxPrice),
      brand: searchParams.get("brand") ?? "",
      type: searchParams.get("type") ?? "",
      gender: searchParams.get("gender") ?? "",
      karat: searchParams.get("karat") ?? "",
      size: searchParams.get("size") ?? "",
      metal: searchParams.get("metal") ?? "",
      occasion: searchParams.get("occasion") ?? "",
      sort: searchParams.get("sort") ?? "default",
    };
  }, [searchParams]);

  const [draft, setDraft] = useState(current);

  useEffect(() => {
    setDraft(current);
  }, [current, open]);

  useEffect(() => {
    if (sections.length && !sections.some((s) => s.id === expanded)) {
      setExpanded(sections[0].id);
    }
  }, [sections, expanded]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function pushParams(next: Record<string, string>, replaceKeys?: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    (replaceKeys ?? Object.keys(next)).forEach((key) => params.delete(key));
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleParam(key: keyof typeof current, value: string) {
    pushParams(
      {
        [key]: toggleCsv(current[key], value),
        minPrice: "",
        maxPrice: "",
      },
      [key, "minPrice", "maxPrice"],
    );
  }

  function applyDraft() {
    pushParams(
      {
        price: draft.price,
        brand: draft.brand,
        type: draft.type,
        gender: draft.gender,
        karat: draft.karat,
        size: draft.size,
        metal: draft.metal,
        occasion: draft.occasion,
        minPrice: "",
        maxPrice: "",
      },
      [...FILTER_KEYS],
    );
    setOpen(false);
  }

  function clearFilters() {
    setDraft({
      price: "",
      brand: "",
      type: "",
      gender: "",
      karat: "",
      size: "",
      metal: "",
      occasion: "",
      sort: current.sort,
    });
    pushParams({}, [...FILTER_KEYS]);
    setOpen(false);
  }

  const appliedFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClick: () => void }> =
      [];

    for (const value of splitCsv(current.price)) {
      chips.push({
        key: `price-${value}`,
        label: labelForPriceValue(value),
        onClick: () => toggleParam("price", value),
      });
    }

    for (const value of splitCsv(current.gender)) {
      const match = facets.genders.find((item) => item.value === value);
      chips.push({
        key: `gender-${value}`,
        label: match?.label ?? (value === "women" ? "Women" : "Men"),
        onClick: () => toggleParam("gender", value),
      });
    }

    for (const value of splitCsv(current.type)) {
      const match = facets.types.find((item) => item.value === value);
      chips.push({
        key: `type-${value}`,
        label:
          match?.label ??
          (value === "gold"
            ? "Gold Jewellery"
            : value === "diamond"
              ? "Diamond Jewellery"
              : value),
        onClick: () => toggleParam("type", value),
      });
    }

    for (const value of splitCsv(current.karat)) {
      const match = facets.karats.find((item) => item.value === value);
      chips.push({
        key: `karat-${value}`,
        label: match?.label ?? `${value}KT`,
        onClick: () => toggleParam("karat", value),
      });
    }

    for (const value of splitCsv(current.size)) {
      const match = facets.sizes.find((item) => item.value === value);
      chips.push({
        key: `size-${value}`,
        label: match?.label ?? (value === "Free Size" ? "Free Size" : `Size ${value}`),
        onClick: () => toggleParam("size", value),
      });
    }

    for (const value of splitCsv(current.occasion)) {
      const match = facets.occasions.find((item) => item.value === value);
      chips.push({
        key: `occasion-${value}`,
        label:
          match?.label ??
          (value === "daily"
            ? "Daily Wear"
            : value === "wedding"
              ? "Wedding"
              : "Festive"),
        onClick: () => toggleParam("occasion", value),
      });
    }

    for (const value of splitCsv(current.metal)) {
      const match = facets.metals.find((item) => item.value === value);
      chips.push({
        key: `metal-${value}`,
        label: match?.label ?? (value === "Gold" ? "Yellow Gold" : value),
        onClick: () => toggleParam("metal", value),
      });
    }

    for (const value of splitCsv(current.brand)) {
      chips.push({
        key: `brand-${value}`,
        label: value,
        onClick: () => toggleParam("brand", value),
      });
    }

    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, facets]);

  const draftCount = useMemo(() => {
    return (
      splitCsv(draft.price).length +
      splitCsv(draft.brand).length +
      splitCsv(draft.type).length +
      splitCsv(draft.gender).length +
      splitCsv(draft.karat).length +
      splitCsv(draft.size).length +
      splitCsv(draft.metal).length +
      splitCsv(draft.occasion).length
    );
  }, [draft]);

  function draftValueFor(sectionId: SectionId) {
    return draft[sectionId];
  }

  function setDraftValue(sectionId: SectionId, next: string) {
    setDraft((value) => ({ ...value, [sectionId]: next }));
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(partnerBtnClass, "group w-fit shrink-0")}
        >
          <ListFilter className="size-3.5" strokeWidth={1.75} />
          Filters
          {appliedFilters.length > 0 ? (
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-primary-foreground transition group-hover:bg-primary-foreground group-hover:text-brand">
              {appliedFilters.length}
            </span>
          ) : (
            <ChevronDown className="size-3.5 opacity-70" strokeWidth={1.75} />
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {appliedFilters.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={pill.onClick}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand/20 bg-brand px-3 text-[12px] font-medium text-primary-foreground transition hover:bg-brand/90"
              aria-label={`Remove ${pill.label}`}
            >
              <X className="size-3" strokeWidth={2.2} />
              {pill.label}
            </button>
          ))}
          {appliedFilters.length > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12px] font-medium text-brand hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[200px] lg:shrink-0">
          <ArrowUpDown
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-brand"
            strokeWidth={1.75}
            aria-hidden
          />
          <NativeSelect
            value={current.sort}
            onChange={(event) =>
              pushParams(
                {
                  sort:
                    event.target.value === "default" ? "" : event.target.value,
                },
                ["sort"],
              )
            }
            className="h-9 border-brand/20 bg-brand/5 py-1.5 pl-9 pr-9 text-[12px] font-medium text-brand transition duration-500 hover:bg-brand/10 focus:border-brand/40 focus:ring-brand/20"
            wrapperClassName="w-full"
          >
            <option value="default">Sort By: Best Matches</option>
            <option value="price-low">Sort By: Price Low to High</option>
            <option value="price-high">Sort By: Price High to Low</option>
            <option value="newest">Sort By: Newest First</option>
            <option value="name">Sort By: Name A to Z</option>
          </NativeSelect>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(100%,400px)] flex-col border-r border-brand/10 bg-white shadow-[8px_0_40px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between border-b border-brand/10 bg-brand/[0.03] px-5 py-4">
              <div>
                <h2 className="font-serif text-xl tracking-tight text-brand">
                  Filters
                </h2>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  {draftCount > 0
                    ? `${draftCount} selected · ${total.toLocaleString("en-IN")} results`
                    : `${total.toLocaleString("en-IN")} products`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-brand/15 p-2 text-brand transition hover:bg-brand hover:text-primary-foreground"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {sections.map((section) => {
                const isOpen = expanded === section.id;
                const options = facets[section.facetKey];
                const Icon = section.Icon;
                return (
                  <div
                    key={section.id}
                    className={cn(
                      "mb-1 overflow-hidden rounded-xl border transition",
                      isOpen
                        ? "border-brand/20 bg-brand/[0.03]"
                        : "border-transparent hover:border-brand/10 hover:bg-neutral-50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((value) =>
                          value === section.id ? "" : section.id,
                        )
                      }
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-3.5 text-left"
                    >
                      <span className="flex items-center gap-2.5 text-[13px] font-medium text-neutral-800">
                        <span className="inline-flex size-8 items-center justify-center rounded-full border border-brand/15 bg-white text-brand">
                          <Icon className="size-4" />
                        </span>
                        {section.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-brand/60 transition duration-300",
                          isOpen && "rotate-180 text-brand",
                        )}
                        strokeWidth={1.75}
                      />
                    </button>
                    {isOpen ? (
                      <div className="space-y-1 px-3 pb-3.5">
                        {options.map((option) => (
                          <FilterOption
                            key={option.value}
                            label={option.label}
                            count={option.count}
                            checked={splitCsv(
                              draftValueFor(section.id),
                            ).includes(option.value)}
                            onChange={() =>
                              setDraftValue(
                                section.id,
                                toggleCsv(
                                  draftValueFor(section.id),
                                  option.value,
                                ),
                              )
                            }
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5 border-t border-brand/10 bg-white p-4">
              <button
                type="button"
                onClick={clearFilters}
                className={cn(partnerBtnClass, "h-11 flex-1 justify-center")}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyDraft}
                className="inline-flex h-11 flex-[1.4] items-center justify-center gap-1 rounded-full bg-brand px-4 text-[12px] font-medium text-primary-foreground transition hover:bg-brand/90"
              >
                Show results
                <ChevronRight className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function FilterOption({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] transition",
        checked
          ? "bg-brand/10 font-medium text-brand"
          : "text-neutral-700 hover:bg-white",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border transition",
          checked
            ? "border-brand bg-brand text-primary-foreground"
            : "border-neutral-300 bg-white",
        )}
        aria-hidden
      >
        {checked ? (
          <svg
            viewBox="0 0 12 12"
            className="size-2.5 fill-none stroke-current"
          >
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="min-w-0 flex-1">{label}</span>
      {typeof count === "number" ? (
        <span className="text-[11px] text-neutral-400">{count}</span>
      ) : null}
    </label>
  );
}

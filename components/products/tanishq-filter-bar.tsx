"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, ListFilter, Plus, X } from "lucide-react";
import { splitCsv, toggleCsv } from "@/lib/products/product-query";

type FilterBarProps = {
  brands: string[];
  total: number;
};

const PRICE_PILLS = [
  { label: "₹10,000 - ₹25,000", min: "10000", max: "25000" },
  { label: "₹25,000 - ₹50,000", min: "25000", max: "50000" },
  { label: "₹50,000 - ₹1,00,000", min: "50000", max: "100000" },
];

const DRAWER_SECTIONS = [
  "Price",
  "Jewellery Type",
  "Brand",
  "Gender",
  "Karatage",
  "Occasion",
  "Metal",
] as const;

const FILTER_KEYS = [
  "price",
  "minPrice",
  "maxPrice",
  "brand",
  "type",
  "gender",
  "karat",
  "metal",
  "occasion",
] as const;

function priceKey(min: string, max: string) {
  return `${min}-${max}`;
}

function legacyPrice(minPrice: string, maxPrice: string) {
  return minPrice && maxPrice ? priceKey(minPrice, maxPrice) : "";
}

export function TanishqFilterBar({ brands, total }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string>("Price");
  const [showMorePills, setShowMorePills] = useState(false);

  const current = useMemo(() => {
    const minPrice = searchParams.get("minPrice") ?? "";
    const maxPrice = searchParams.get("maxPrice") ?? "";
    return {
      price: searchParams.get("price") || legacyPrice(minPrice, maxPrice),
      brand: searchParams.get("brand") ?? "",
      type: searchParams.get("type") ?? "",
      gender: searchParams.get("gender") ?? "",
      karat: searchParams.get("karat") ?? "",
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
      metal: "",
      occasion: "",
      sort: current.sort,
    });
    pushParams({}, [...FILTER_KEYS]);
    setOpen(false);
  }

  const pills = [
    ...PRICE_PILLS.map((pill) => {
      const value = priceKey(pill.min, pill.max);
      return {
        key: pill.label,
        label: pill.label,
        active: splitCsv(current.price).includes(value),
        onClick: () => toggleParam("price", value),
      };
    }),
    {
      key: "women",
      label: "Women",
      active: splitCsv(current.gender).includes("women"),
      onClick: () => toggleParam("gender", "women"),
    },
    {
      key: "gold",
      label: "Gold Jewellery",
      active: splitCsv(current.type).includes("gold"),
      onClick: () => toggleParam("type", "gold"),
    },
    {
      key: "22",
      label: "22",
      active: splitCsv(current.karat).includes("22"),
      onClick: () => toggleParam("karat", "22"),
    },
  ];

  const visiblePills = showMorePills ? pills : pills.slice(0, 4);

  const extraSelected = [
    ...splitCsv(current.occasion).map((value) => ({
      key: `occasion-${value}`,
      label:
        value === "daily"
          ? "Daily Wear"
          : value === "wedding"
            ? "Wedding"
            : "Festive",
      onClick: () => toggleParam("occasion", value),
    })),
    ...splitCsv(current.metal).map((value) => ({
      key: `metal-${value}`,
      label: value === "Gold" ? "Yellow Gold" : value,
      onClick: () => toggleParam("metal", value),
    })),
    ...splitCsv(current.brand).map((value) => ({
      key: `brand-${value}`,
      label: value,
      onClick: () => toggleParam("brand", value),
    })),
    ...splitCsv(current.type)
      .filter((value) => value !== "gold")
      .map((value) => ({
        key: `type-${value}`,
        label: value === "diamond" ? "Diamond Jewellery" : value,
        onClick: () => toggleParam("type", value),
      })),
    ...splitCsv(current.gender)
      .filter((value) => value !== "women")
      .map((value) => ({
        key: `gender-${value}`,
        label: "Men",
        onClick: () => toggleParam("gender", value),
      })),
    ...splitCsv(current.karat)
      .filter((value) => value !== "22")
      .map((value) => ({
        key: `karat-${value}`,
        label: `${value}KT`,
        onClick: () => toggleParam("karat", value),
      })),
  ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 px-5 text-sm text-neutral-800"
        >
          <ListFilter className="size-4" strokeWidth={1.6} />
          Filter
          <ChevronDown className="size-4 text-neutral-500" />
        </button>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {visiblePills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={pill.onClick}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm ${
                pill.active
                  ? "bg-[#8b2e2e] text-white"
                  : "border border-[#ead9c4] bg-[#faf6f0] text-neutral-700 hover:bg-[#f6ead7]"
              }`}
            >
              {pill.active ? (
                <X className="size-3.5" strokeWidth={2.4} />
              ) : (
                <span className="flex size-[18px] items-center justify-center rounded-full bg-[#f3e4c8] text-[#8b2e2e]">
                  <Plus className="size-3" strokeWidth={2.5} />
                </span>
              )}
              {pill.label}
            </button>
          ))}
          {extraSelected.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={pill.onClick}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#8b2e2e] px-4 text-sm text-white"
            >
              <X className="size-3.5" strokeWidth={2.4} />
              {pill.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowMorePills((value) => !value)}
            className="text-sm text-[#8b2e2e]"
          >
            {showMorePills ? "Show Less" : "+ Show More"}
          </button>
        </div>

        <select
          value={current.sort}
          onChange={(event) =>
            pushParams(
              { sort: event.target.value === "default" ? "" : event.target.value },
              ["sort"],
            )
          }
          className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none"
        >
          <option value="default">Sort By: Best Matches</option>
          <option value="price-low">Sort By: Price Low to High</option>
          <option value="price-high">Sort By: Price High to Low</option>
          <option value="newest">Sort By: Newest First</option>
          <option value="name">Sort By: Name A to Z</option>
        </select>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(100%,380px)] flex-col rounded-r-2xl bg-[#faf8f6] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="font-serif text-2xl text-neutral-900">Filter By</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-neutral-600 hover:bg-white"
                aria-label="Close"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2">
              {DRAWER_SECTIONS.map((section) => (
                <div key={section} className="border-b border-neutral-200">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((value) => (value === section ? "" : section))
                    }
                    className="flex w-full items-center justify-between px-4 py-4 text-left text-sm text-neutral-800"
                  >
                    {section}
                    <ChevronDown
                      className={`size-4 text-neutral-500 transition ${
                        expanded === section ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expanded === section ? (
                    <div className="space-y-2 px-4 pb-4">
                      {section === "Price"
                        ? PRICE_PILLS.map((pill) => (
                            <FilterOption
                              key={pill.label}
                              label={pill.label}
                              checked={splitCsv(draft.price).includes(
                                priceKey(pill.min, pill.max),
                              )}
                              onChange={() =>
                                setDraft((value) => ({
                                  ...value,
                                  price: toggleCsv(
                                    value.price,
                                    priceKey(pill.min, pill.max),
                                  ),
                                }))
                              }
                            />
                          ))
                        : null}
                      {section === "Jewellery Type" ? (
                        <>
                          <FilterOption
                            label="Gold Jewellery"
                            checked={splitCsv(draft.type).includes("gold")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                type: toggleCsv(value.type, "gold"),
                              }))
                            }
                          />
                          <FilterOption
                            label="Diamond Jewellery"
                            checked={splitCsv(draft.type).includes("diamond")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                type: toggleCsv(value.type, "diamond"),
                              }))
                            }
                          />
                        </>
                      ) : null}
                      {section === "Brand"
                        ? brands.map((brand) => (
                            <FilterOption
                              key={brand}
                              label={brand}
                              checked={splitCsv(draft.brand).includes(brand)}
                              onChange={() =>
                                setDraft((value) => ({
                                  ...value,
                                  brand: toggleCsv(value.brand, brand),
                                }))
                              }
                            />
                          ))
                        : null}
                      {section === "Gender" ? (
                        <>
                          <FilterOption
                            label="Women"
                            checked={splitCsv(draft.gender).includes("women")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                gender: toggleCsv(value.gender, "women"),
                              }))
                            }
                          />
                          <FilterOption
                            label="Men"
                            checked={splitCsv(draft.gender).includes("men")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                gender: toggleCsv(value.gender, "men"),
                              }))
                            }
                          />
                        </>
                      ) : null}
                      {section === "Karatage" ? (
                        <>
                          <FilterOption
                            label="18KT"
                            checked={splitCsv(draft.karat).includes("18")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                karat: toggleCsv(value.karat, "18"),
                              }))
                            }
                          />
                          <FilterOption
                            label="22KT"
                            checked={splitCsv(draft.karat).includes("22")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                karat: toggleCsv(value.karat, "22"),
                              }))
                            }
                          />
                        </>
                      ) : null}
                      {section === "Occasion" ? (
                        <>
                          <FilterOption
                            label="Daily Wear"
                            checked={splitCsv(draft.occasion).includes("daily")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                occasion: toggleCsv(value.occasion, "daily"),
                              }))
                            }
                          />
                          <FilterOption
                            label="Wedding"
                            checked={splitCsv(draft.occasion).includes("wedding")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                occasion: toggleCsv(value.occasion, "wedding"),
                              }))
                            }
                          />
                          <FilterOption
                            label="Festive"
                            checked={splitCsv(draft.occasion).includes("festive")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                occasion: toggleCsv(value.occasion, "festive"),
                              }))
                            }
                          />
                        </>
                      ) : null}
                      {section === "Metal" ? (
                        <>
                          <FilterOption
                            label="Yellow Gold"
                            checked={splitCsv(draft.metal).includes("Gold")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                metal: toggleCsv(value.metal, "Gold"),
                              }))
                            }
                          />
                          <FilterOption
                            label="White Gold"
                            checked={splitCsv(draft.metal).includes("White Gold")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                metal: toggleCsv(value.metal, "White Gold"),
                              }))
                            }
                          />
                          <FilterOption
                            label="Rose Gold"
                            checked={splitCsv(draft.metal).includes("Rose Gold")}
                            onChange={() =>
                              setDraft((value) => ({
                                ...value,
                                metal: toggleCsv(value.metal, "Rose Gold"),
                              }))
                            }
                          />
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex gap-3 border-t border-neutral-200 bg-[#faf8f6] p-4">
              <button
                type="button"
                onClick={clearFilters}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#f3e6e4] py-3 text-sm text-neutral-800"
              >
                Clear Filters
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={applyDraft}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#8b2e2e] py-3 text-sm text-white"
              >
                Show Result ({total.toLocaleString("en-IN")})
                <ChevronRight className="size-4" />
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
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-neutral-300 accent-[#8b2e2e]"
      />
      {label}
    </label>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  CircleDot,
  FileText,
  Gem,
  Sparkles,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type JewelleryDetailsProps = {
  name: string;
  description: string;
  thumbnail: string | null;
  sku?: string | null;
  basePrice: number;
  compareAtPrice?: number | null;
  taxPercent?: number;
  attributes?: Record<string, unknown> | null;
};

type AccordionId = "metal" | "general" | "description";

function asString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function parseWeightGrams(weight: string) {
  const match = weight.match(/([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

function detectKaratage(metal: string, purity: string) {
  if (purity) {
    const fromPurity = purity.match(/(\d{1,2})\s*K/i);
    if (fromPurity) return `${fromPurity[1]}K`;
    if (/^\d{1,2}$/.test(purity)) return `${purity}K`;
    return purity;
  }
  const fromMetal = metal.match(/(\d{1,2})\s*K/i);
  return fromMetal ? `${fromMetal[1]}K` : "—";
}

function detectColour(metal: string) {
  if (/white/i.test(metal)) return "White";
  if (/rose/i.test(metal)) return "Rose";
  if (/yellow/i.test(metal)) return "Yellow";
  if (/gold/i.test(metal)) return "Yellow";
  if (/platinum|silver/i.test(metal)) return "White";
  return "—";
}

function detectMetalLabel(metal: string) {
  if (!metal) return "Gold";
  if (/platinum/i.test(metal)) return "Platinum";
  if (/silver/i.test(metal)) return "Silver";
  if (/gold/i.test(metal)) return "Gold";
  return metal.split(" ")[0] || "Gold";
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function JewelleryDetails({
  name,
  description,
  thumbnail,
  sku,
  basePrice,
  compareAtPrice,
  taxPercent = 3,
  attributes,
}: JewelleryDetailsProps) {
  const [tab, setTab] = useState<"details" | "breakup">("details");
  const [openId, setOpenId] = useState<AccordionId>("metal");

  const attrs = useMemo(() => {
    const source = attributes ?? {};
    const metal = asString(source.metal);
    const purity = asString(source.purity);
    const stone = asString(source.stone);
    const weight = asString(source.weight);
    const length = asString(source.length);
    const finish = asString(source.finish);
    const style = asString(source.style);
    const quantity = asString(source.quantity);
    const diameter = asString(source.diameter);

    return {
      metal,
      purity,
      stone,
      weight,
      length,
      finish,
      style,
      quantity,
      diameter,
      karatage: detectKaratage(metal, purity),
      colour: detectColour(metal),
      metalLabel: detectMetalLabel(metal),
      weightGrams: parseWeightGrams(weight),
    };
  }, [attributes]);

  const breakup = useMemo(() => {
    const gstRate = taxPercent > 0 ? taxPercent : 3;
    const inclusive = basePrice;
    const preTax = inclusive / (1 + gstRate / 100);
    const gst = inclusive - preTax;
    const makingShare = 0.22;
    const making = preTax * makingShare;
    const metalValue = preTax - making;
    const weight = attrs.weightGrams > 0 ? attrs.weightGrams : 0;
    const ratePerGram = weight > 0 ? metalValue / weight : 0;
    const discount =
      compareAtPrice && compareAtPrice > basePrice
        ? compareAtPrice - basePrice
        : 0;

    return {
      metalLabel: `${attrs.colour !== "—" ? attrs.colour + " " : ""}${attrs.metalLabel}${
        attrs.karatage !== "—" ? ` ${attrs.karatage}` : ""
      }`.trim(),
      ratePerGram,
      weight,
      metalValue,
      making,
      subtotal: preTax,
      gst,
      gstRate,
      discount,
      grandTotal: inclusive,
    };
  }, [attrs, basePrice, compareAtPrice, taxPercent]);

  const generalItems = [
    attrs.stone ? { label: "Stone", value: attrs.stone } : null,
    attrs.length ? { label: "Length", value: attrs.length } : null,
    attrs.diameter ? { label: "Diameter", value: attrs.diameter } : null,
    attrs.finish ? { label: "Finish", value: attrs.finish } : null,
    attrs.style ? { label: "Style", value: attrs.style } : null,
    attrs.quantity ? { label: "Quantity", value: attrs.quantity } : null,
    sku ? { label: "SKU", value: sku } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const metalItems = [
    { label: "Karatage", value: attrs.karatage },
    { label: "Material Colour", value: attrs.colour },
    {
      label: "Gross Weight",
      value: attrs.weight || (attrs.weightGrams ? `${attrs.weightGrams}g` : "—"),
    },
    { label: "Metal", value: attrs.metalLabel },
  ];

  function toggle(id: AccordionId) {
    setOpenId((current) => (current === id ? current : id));
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white px-4 py-8 md:px-8 md:py-10">
      <h2 className="text-center font-serif text-3xl text-neutral-900 md:text-4xl">
        Jewellery Details
      </h2>

      <div className="mx-auto mt-6 flex max-w-xl rounded-full border border-neutral-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setTab("details")}
          className={cn(
            "h-11 flex-1 rounded-full text-sm font-medium transition",
            tab === "details"
              ? "bg-[#8b2e2e] text-white shadow-sm"
              : "bg-transparent text-neutral-700 hover:text-[#8b2e2e]",
          )}
        >
          Product Details
        </button>
        <button
          type="button"
          onClick={() => setTab("breakup")}
          className={cn(
            "h-11 flex-1 rounded-full text-sm font-medium transition",
            tab === "breakup"
              ? "bg-[#8b2e2e] text-white shadow-sm"
              : "bg-transparent text-neutral-700 hover:text-[#8b2e2e]",
          )}
        >
          Price Breakup
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0">
          {tab === "details" ? (
            <div className="space-y-3">
              <AccordionCard
                id="metal"
                open={openId === "metal"}
                onToggle={() => toggle("metal")}
                icon={<Sparkles className="size-4" strokeWidth={1.6} />}
                title="Metal Details"
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                  {metalItems.map((item) => (
                    <div key={item.label}>
                      <p className="text-sm font-semibold text-neutral-900">
                        {item.value}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionCard>

              <AccordionCard
                id="general"
                open={openId === "general"}
                onToggle={() => toggle("general")}
                icon={<CircleDot className="size-4" strokeWidth={1.6} />}
                title="General Details"
              >
                {generalItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                    {generalItems.map((item) => (
                      <div key={item.label}>
                        <p className="text-sm font-semibold text-neutral-900">
                          {item.value}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Extra product attributes will appear here.
                  </p>
                )}
              </AccordionCard>

              <AccordionCard
                id="description"
                open={openId === "description"}
                onToggle={() => toggle("description")}
                icon={<FileText className="size-4" strokeWidth={1.6} />}
                title="Description"
              >
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                  {description}
                </p>
              </AccordionCard>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-[#faf7f5] text-[11px] tracking-[0.08em] text-neutral-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product Details</th>
                    <th className="px-3 py-3 font-medium">Rate</th>
                    <th className="px-3 py-3 font-medium">Weight</th>
                    <th className="px-3 py-3 font-medium">Discount</th>
                    <th className="px-4 py-3 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  <tr>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Gem className="size-4 text-[#c5a46e]" strokeWidth={1.6} />
                        <span>{breakup.metalLabel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-neutral-600">
                      {breakup.ratePerGram > 0
                        ? `${formatInr(breakup.ratePerGram)}/g`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-neutral-600">
                      {breakup.weight > 0 ? `${breakup.weight}g` : "—"}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatInr(breakup.metalValue)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Making Charges</td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-3 py-3 text-neutral-600">
                      {breakup.discount > 0
                        ? formatCurrency(breakup.discount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatInr(breakup.making)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Sub Total</td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-3 py-3 text-neutral-600">
                      {breakup.weight > 0
                        ? `Gross Wt. ${breakup.weight}g`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatInr(breakup.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">GST ({breakup.gstRate}%)</td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatInr(breakup.gst)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-[#f5f1ed]">
                    <td
                      colSpan={4}
                      className="px-4 py-3.5 font-serif text-base text-neutral-900"
                    >
                      Grand Total
                    </td>
                    <td className="px-4 py-3.5 text-right font-serif text-lg text-[#8b2e2e]">
                      {formatCurrency(breakup.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          {sku ? (
            <p className="text-right text-xs tracking-wide text-neutral-400">
              SKU ID : {sku}
            </p>
          ) : null}
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-[#f4efea]">
            {thumbnail && !thumbnail.includes("placeholder") ? (
              <Image
                src={thumbnail}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            ) : (
              <div className="flex size-full items-center justify-center font-serif text-2xl tracking-[0.2em] text-[#8b2e2e]/60">
                VIDYORA
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#ead9c4] bg-[#faf6f0] px-4 py-3">
            <Sparkles className="size-5 shrink-0 text-[#c5a46e]" strokeWidth={1.6} />
            <p className="text-sm text-neutral-700">
              Enjoy sparkling jewellery! We provide free jewellery cleaning
              services.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AccordionCard({
  id,
  open,
  onToggle,
  icon,
  title,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`jewellery-${id}`}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#faf7f5]"
      >
        <span className="text-[#8b2e2e]">{icon}</span>
        <span className="flex-1 text-sm font-semibold tracking-[0.12em] text-neutral-800 uppercase">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-neutral-500 transition",
            open && "rotate-180",
          )}
          strokeWidth={1.7}
        />
      </button>
      {open ? (
        <div id={`jewellery-${id}`} className="border-t border-neutral-100 px-4 py-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

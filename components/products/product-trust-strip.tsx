import {
  Award,
  BadgeCheck,
  RefreshCcw,
  Shield,
  Truck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ProductTrustStripProps = {
  returnWindowDays?: number;
  freeShippingThreshold?: number;
};

export function ProductTrustStrip({
  returnWindowDays = 5,
  freeShippingThreshold,
}: ProductTrustStripProps) {
  const items = [
    {
      label: "316L Steel",
      hint: "Hypoallergenic quality",
      icon: Award,
    },
    {
      label: "Certified",
      hint: "Premium finish",
      icon: BadgeCheck,
    },
    {
      label: "Easy Returns",
      hint: `${returnWindowDays}-day return & replacement`,
      icon: RefreshCcw,
    },
    freeShippingThreshold != null && freeShippingThreshold > 0
      ? {
          label: "Free Shipping",
          hint: `On orders over ${formatCurrency(freeShippingThreshold)}`,
          icon: Truck,
        }
      : {
          label: "Insured Ship",
          hint: "Safe delivery",
          icon: Shield,
        },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(({ label, hint, icon: Icon }) => (
        <div
          key={label}
          className="group flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-3.5 py-3 transition duration-300 hover:border-[#8b2e2e]/25 hover:shadow-[0_8px_24px_rgba(139,46,46,0.08)]"
        >
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#8b2e2e]/8 text-[#8b2e2e] transition duration-300 group-hover:bg-[#8b2e2e] group-hover:text-white">
            <Icon className="size-4" strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold leading-snug text-brand">
              {label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">
              {hint}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

import {
  Award,
  BadgeCheck,
  RefreshCcw,
  Shield,
} from "lucide-react";

const TRUST_ITEMS = [
  {
    label: "BIS Hallmark",
    hint: "Purity assured",
    icon: Award,
  },
  {
    label: "Certified",
    hint: "Authentic stones",
    icon: BadgeCheck,
  },
  {
    label: "Easy Returns",
    hint: "7-day window",
    icon: RefreshCcw,
  },
  {
    label: "Insured Ship",
    hint: "Safe delivery",
    icon: Shield,
  },
] as const;

export function ProductTrustStrip() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TRUST_ITEMS.map(({ label, hint, icon: Icon }) => (
        <div
          key={label}
          className="group flex items-center gap-2.5 rounded-2xl border border-[#ead9c4]/80 bg-gradient-to-br from-white to-[#faf6f0] px-3 py-2.5 transition duration-300 hover:border-[#8b2e2e]/25 hover:shadow-[0_8px_24px_rgba(139,46,46,0.08)]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#8b2e2e]/8 text-[#8b2e2e] transition duration-300 group-hover:bg-[#8b2e2e] group-hover:text-white">
            <Icon className="size-3.5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-wide text-neutral-800 uppercase">
              {label}
            </p>
            <p className="truncate text-[10px] text-neutral-500">{hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

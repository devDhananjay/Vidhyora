import { BadgeCheck, Gem, Handshake, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ASSURANCES = [
  {
    label: "Quality Craftsmanship",
    icon: Gem,
  },
  {
    label: "Ethically Sourced",
    icon: Handshake,
  },
  {
    label: "100% Transparency",
    icon: BadgeCheck,
  },
] as const;

type VidyoraAssuranceProps = {
  compact?: boolean;
};

export function VidyoraAssurance({ compact = false }: VidyoraAssuranceProps) {
  const body = (
    <div className="relative overflow-hidden">
      <div className="relative z-10 flex max-w-[85%] flex-col gap-2.5 pr-2">
        <h3
          className={cn(
            "font-serif text-[#8b2e2e]",
            compact ? "text-lg md:text-xl" : "text-2xl md:text-[28px]",
          )}
        >
          VIDYORA Assurance
        </h3>

        <p className="text-xs text-neutral-500 md:text-[13px]">
          Crafted by experts, cherished by you.
        </p>

        <ul className="space-y-2">
          {ASSURANCES.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#8b2e2e]/8 text-[#8b2e2e]">
                <Icon className="size-3.5" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-medium text-neutral-800 md:text-[13px]">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="pointer-events-none absolute -right-2 top-1/2 hidden size-24 -translate-y-1/2 sm:block md:right-1 md:size-28"
        aria-hidden
      >
        <span className="absolute inset-0 rounded-full border border-[#8b2e2e]/12" />
        <span className="absolute inset-3 rounded-full border border-[#8b2e2e]/15" />
        <span className="absolute inset-5 rounded-full border-2 border-transparent border-t-[#c17a7a]/60 border-r-[#c17a7a]/35" />
        <span className="absolute inset-0 flex items-center justify-center text-[#8b2e2e]">
          <ShieldCheck className="size-6" strokeWidth={1.4} />
        </span>
      </div>
    </div>
  );

  if (compact) return body;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
      {body}
    </section>
  );
}

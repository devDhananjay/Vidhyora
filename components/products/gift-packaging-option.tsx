"use client";

import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";
import { GIFT_PACKAGING_FEE } from "@/lib/cart/gift-packaging";

type GiftPackagingOptionProps = {
  selected: boolean;
  onChange: (selected: boolean) => void;
  className?: string;
};

export function GiftPackagingOption({
  selected,
  onChange,
  className,
}: GiftPackagingOptionProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 sm:gap-4 sm:px-4",
        selected && "border-primary",
        className,
      )}
    >
      <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white sm:size-16">
        <Image
          src="/brand/gift-bag.png"
          alt="Gift packaging bag"
          width={40}
          height={40}
          unoptimized
          className="size-8 object-contain sm:size-9"
          priority={false}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand sm:text-[15px]">
          Gift Packaging
        </p>
        <p className="mt-0.5 text-xs leading-5 text-neutral-500 sm:text-sm">
          Get your jewellery in a special gift bag for just{" "}
          {formatCurrency(GIFT_PACKAGING_FEE)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!selected)}
        className={cn(
          "shrink-0 rounded-xl border px-3 py-1.5 text-sm font-semibold transition sm:px-4",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary bg-white text-primary hover:bg-neutral-50",
        )}
        aria-pressed={selected}
      >
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

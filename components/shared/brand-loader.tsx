"use client";

import Image from "next/image";
import { BRAND_LOADER_ICON_SRC, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BrandLoaderProps = {
  /** Full-viewport overlay (Tanishq-style) vs inline block */
  overlay?: boolean;
  className?: string;
  label?: string;
};

/**
 * Tanishq-style loader: spinning arc around the VIDYORA monogram.
 */
export function BrandLoader({
  overlay = false,
  className,
  label,
}: BrandLoaderProps) {
  const mark = (
    <div
      className={cn(
        "relative flex size-[5.25rem] items-center justify-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label || `Loading ${APP_NAME}`}
    >
      <span
        className="vidyora-loader-ring absolute inset-0 rounded-full"
        aria-hidden
      />
      <Image
        src={BRAND_LOADER_ICON_SRC}
        alt=""
        width={44}
        height={44}
        className="relative z-[1] size-11 object-contain"
        priority
      />
      <span className="sr-only">{label || `Loading ${APP_NAME}`}</span>
    </div>
  );

  if (!overlay) return mark;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-[#f7f5f2]/80 backdrop-blur-[1.5px]">
      {mark}
    </div>
  );
}

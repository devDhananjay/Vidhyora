import Image from "next/image";
import { APP_NAME, BRAND_LOGO_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { width: 64, height: 64, className: "h-14 w-14" },
  md: {
    width: 180,
    height: 180,
    className: "h-[104px] w-[104px] md:h-[120px] md:w-[120px]",
  },
  lg: { width: 220, height: 220, className: "h-40 w-40 md:h-44 md:w-44" },
  xl: { width: 280, height: 280, className: "h-52 w-52 md:h-60 md:w-60" },
} as const;

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: keyof typeof SIZES;
};

export function BrandLogo({
  className,
  priority = false,
  size = "md",
}: BrandLogoProps) {
  const s = SIZES[size];

  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={APP_NAME}
      width={s.width}
      height={s.height}
      priority={priority}
      unoptimized
      className={cn("object-contain object-bottom", s.className, className)}
    />
  );
}

import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconNecklace(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4.5c1.6 3.2 3.2 5.2 5 5.2s3.4-2 5-5.2" />
      <path d="M9.2 14.2 12 21l2.8-6.8" />
      <circle cx="12" cy="11.2" r="1.4" />
    </Svg>
  );
}

export function IconEarrings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="5.5" r="1.2" />
      <path d="M8 6.7v3.2" />
      <path d="M6.4 14.2c0-2.2 1.4-3.8 1.6-4.3.2.5 1.6 2.1 1.6 4.3a1.6 1.6 0 1 1-3.2 0Z" />
      <circle cx="16" cy="5.5" r="1.2" />
      <path d="M16 6.7v3.2" />
      <path d="M14.4 14.2c0-2.2 1.4-3.8 1.6-4.3.2.5 1.6 2.1 1.6 4.3a1.6 1.6 0 1 1-3.2 0Z" />
    </Svg>
  );
}

export function IconPendant(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 4.5c1.8 3.4 3.6 5.4 5.5 5.4s3.7-2 5.5-5.4" />
      <path d="M12 10.2v2.2" />
      <path d="M12 12.4c-1.7 0-3 2.4-3 4.2 0 2 1.4 3.9 3 3.9s3-1.9 3-3.9c0-1.8-1.3-4.2-3-4.2Z" />
    </Svg>
  );
}

export function IconRing(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="15.2" rx="6.2" ry="4.3" />
      <path d="M7.2 13.2c.6-1.6 2.5-2.7 4.8-2.7s4.2 1.1 4.8 2.7" />
      <path d="M10.2 8.4 12 5.6l1.8 2.8-1.8 1.1-1.8-1.1Z" />
    </Svg>
  );
}

export function IconMangalsutra(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 4.8c2.2 3.8 4.4 6 6.5 6s4.3-2.2 6.5-6" />
      <circle cx="9.2" cy="14.4" r="2.2" />
      <circle cx="14.8" cy="14.4" r="2.2" />
      <path d="M11 13.2h2" />
    </Svg>
  );
}

export function IconChain(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="8.2" cy="8.4" rx="2.4" ry="3.2" transform="rotate(-35 8.2 8.4)" />
      <ellipse cx="12" cy="12" rx="2.4" ry="3.2" transform="rotate(-35 12 12)" />
      <ellipse cx="15.8" cy="15.6" rx="2.4" ry="3.2" transform="rotate(-35 15.8 15.6)" />
    </Svg>
  );
}

export function IconNosePin(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8.5" cy="12" r="2.1" />
      <path d="M10.5 11.4c2.4-.8 5.2-.2 7.3 2.1" />
      <circle cx="8.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconBangles(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="13.5" rx="6.4" ry="5" />
      <ellipse cx="12" cy="13.5" rx="4.2" ry="3.2" />
      <path d="M8.2 9.4c.7-1.5 2.2-2.4 3.8-2.4" />
    </Svg>
  );
}

export function IconBracelet(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="13" rx="7" ry="4.4" />
      <path d="M6.4 11.4c.5-1.8 2.8-3.1 5.6-3.1s5.1 1.3 5.6 3.1" />
      <circle cx="12" cy="8.3" r="1.2" />
    </Svg>
  );
}

export function IconNecklaceSet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 4.2c1.9 3.2 3.8 5 5.5 5s3.6-1.8 5.5-5" />
      <circle cx="12" cy="11.4" r="1.3" />
      <path d="M12 12.7 10.6 16h2.8L12 12.7Z" />
      <circle cx="7.2" cy="17.6" r="1.4" />
      <circle cx="16.8" cy="17.6" r="1.4" />
    </Svg>
  );
}

export function IconPendantSet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4.5c1.2 2.4 2.5 3.8 4 3.8s2.8-1.4 4-3.8" />
      <path d="M12 8.6v1.6" />
      <path d="M12 10.2c-1.2 0-2.1 1.7-2.1 3s1 2.7 2.1 2.7 2.1-1.4 2.1-2.7-0.9-3-2.1-3Z" />
      <circle cx="6.4" cy="17.8" r="1.5" />
      <circle cx="17.6" cy="17.8" r="1.5" />
    </Svg>
  );
}

export function IconDiamond(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.2 9.2 12 4.8l4.8 4.4L12 20.2 7.2 9.2Z" />
      <path d="M7.2 9.2h9.6" />
      <path d="M9.2 9.2 12 20.2 14.8 9.2" />
    </Svg>
  );
}

export function IconGift(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="9" rx="0.8" />
      <path d="M5 14.2h14" />
      <path d="M12 10.5v9" />
      <path d="M12 10.5c-1.6-2.6-4.4-2.8-5.2-1.4-.7 1.2.6 2.4 2.6 2.4H12" />
      <path d="M12 10.5c1.6-2.6 4.4-2.8 5.2-1.4.7 1.2-.6 2.4-2.6 2.4H12" />
    </Svg>
  );
}

export function IconWedding(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9.2" cy="13" r="4.4" />
      <circle cx="14.8" cy="13" r="4.4" />
    </Svg>
  );
}

export function IconDaily(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="12.5" r="4.2" />
      <circle cx="15" cy="12.5" r="4.2" />
    </Svg>
  );
}

export function IconGem(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 8.2h8l2.4 4.2L12 20 5.6 12.4 8 8.2Z" />
      <path d="M8 8.2 12 12.4 16 8.2" />
      <path d="M5.6 12.4h12.8" />
    </Svg>
  );
}

export function IconCoin(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 9.2v5.6" />
    </Svg>
  );
}

export function IconKada(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 13.5c0-3.8 2.7-6.8 6-6.8s6 3 6 6.8" />
      <path d="M5.2 13.5h13.6" />
      <path d="M7.4 13.5c.4 3 2.2 5 4.6 5s4.2-2 4.6-5" />
    </Svg>
  );
}

export function IconPerson(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="2.6" />
      <path d="M6.8 18.5c.7-3.2 2.6-4.8 5.2-4.8s4.5 1.6 5.2 4.8" />
    </Svg>
  );
}

const BY_LABEL: Record<string, (props: IconProps) => ReactNode> = {
  "all jewellery": IconNecklace,
  "all gold": IconBangles,
  "all diamond jewellery": IconDiamond,
  earrings: IconEarrings,
  pendants: IconPendant,
  "finger rings": IconRing,
  mangalsutra: IconMangalsutra,
  chains: IconChain,
  "nose pin": IconNosePin,
  necklaces: IconNecklace,
  "necklace set": IconNecklaceSet,
  bangles: IconBangles,
  bracelets: IconBracelet,
  "pendants & earring set": IconPendantSet,
  women: IconEarrings,
  men: IconPerson,
  kids: IconRing,
  unisex: IconDaily,
  "special coins": IconCoin,
  "1 gram": IconCoin,
  "2 gram": IconCoin,
  "4 gram": IconCoin,
  "8 gram": IconCoin,
  "10 gram": IconCoin,
};

export function jewelleryIconFor(label: string) {
  const key = label.toLowerCase();
  if (BY_LABEL[key]) return BY_LABEL[key];
  if (key.includes("pendant") && key.includes("earring")) return IconPendantSet;
  if (key.includes("necklace set") || key.includes("sets")) return IconNecklaceSet;
  if (key.includes("mangalsutra")) return IconMangalsutra;
  if (key.includes("earring")) return IconEarrings;
  if (key.includes("nose")) return IconNosePin;
  if (key.includes("chain")) return IconChain;
  if (key.includes("necklace")) return IconNecklace;
  if (key.includes("pendant")) return IconPendant;
  if (key.includes("bangle")) return IconBangles;
  if (key.includes("bracelet")) return IconBracelet;
  if (key.includes("kada")) return IconKada;
  if (key.includes("ring")) return IconRing;
  if (key.includes("coin")) return IconCoin;
  if (key.includes("gift") || key.includes("gram")) return IconGift;
  if (key.includes("diamond")) return IconDiamond;
  if (key.includes("gold")) return IconBangles;
  return IconNecklace;
}

export function JewelleryLineIcon({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const Icon = jewelleryIconFor(label);
  return <Icon className={className} />;
}

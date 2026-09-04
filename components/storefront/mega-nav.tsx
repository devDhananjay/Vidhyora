"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MEGA_MENU, type MegaLink, type MegaMenuItem } from "@/lib/nav/mega-menu-data";
import {
  IconBangles,
  IconDaily,
  IconDiamond,
  IconEarrings,
  IconGem,
  IconGift,
  IconNecklace,
  IconRing,
  IconWedding,
  JewelleryLineIcon,
} from "@/components/storefront/jewellery-icons";

const NAV_ICONS = {
  all: IconNecklace,
  gold: IconBangles,
  diamond: IconDiamond,
  earrings: IconEarrings,
  daily: IconDaily,
  gemstone: IconGem,
  wedding: IconWedding,
  gifting: IconGift,
  under50k: IconRing,
} as const;

function splitColumns<T>(items: T[], columnCount: number) {
  const perColumn = Math.ceil(items.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) =>
    items.slice(index * perColumn, (index + 1) * perColumn),
  );
}

export function MegaNav({ disabled = false }: { disabled?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState("Category");
  const closeTimer = useRef<number | null>(null);

  const active =
    !disabled && openId
      ? (MEGA_MENU.find((item) => item.id === openId) ?? null)
      : null;

  function open(id: string) {
    if (disabled) return;
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    const item = MEGA_MENU.find((entry) => entry.id === id);
    setSidebar(item?.sidebar[0] ?? "Category");
    setOpenId(id);
  }

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenId(null), 140);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (disabled) setOpenId(null);
  }, [disabled]);

  return (
    <div
      className="relative hidden border-t border-neutral-100 md:block"
      onMouseLeave={scheduleClose}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-7 px-4 py-1">
        {MEGA_MENU.map((item) => {
          const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS];
          const isActive = openId === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onMouseEnter={() => open(item.id)}
              onClick={() => setOpenId(null)}
              className={`relative flex flex-col items-center gap-1 py-1.5 transition ${
                isActive ? "text-[#8b2e2e]" : "text-[#8b2e2e]/85 hover:text-[#8b2e2e]"
              }`}
            >
              <Icon className="size-[18px] text-[#8b2e2e]" />
              <span className="text-[10px] font-semibold tracking-[0.14em] text-[#8b2e2e] uppercase">
                {item.label}
              </span>
              {isActive ? (
                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#8b2e2e]" />
              ) : null}
            </Link>
          );
        })}
      </div>

      {active ? (
        <div
          className="absolute inset-x-0 top-full z-50 border-t border-neutral-100 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
          onMouseEnter={() => open(active.id)}
        >
          <MegaPanel
            item={active}
            sidebar={sidebar}
            setSidebar={setSidebar}
            onNavigate={() => setOpenId(null)}
          />
        </div>
      ) : null}
    </div>
  );
}

function MegaPanel({
  item,
  sidebar,
  setSidebar,
  onNavigate,
}: {
  item: MegaMenuItem;
  sidebar: string;
  setSidebar: (value: string) => void;
  onNavigate: () => void;
}) {
  const panel = item.panels?.[sidebar];

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-[180px_minmax(0,1fr)_230px] items-stretch">
      <aside className="border-r border-neutral-100 py-4 pr-3">
        {item.sidebar.map((tab) => {
          const selected = sidebar === tab;
          return (
            <button
              key={tab}
              type="button"
              onMouseEnter={() => setSidebar(tab)}
              className={`flex w-full items-center justify-between rounded-r-lg px-4 py-2.5 text-left text-[13px] transition ${
                selected
                  ? "bg-[#f6ebe8] font-medium text-[#8b2e2e] shadow-[inset_3px_0_0_#8b2e2e]"
                  : "text-neutral-700 hover:bg-[#faf7f5]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </aside>

      <div className="flex min-h-[300px] flex-col justify-between px-6 py-5">
        <div>
          {panel?.kind === "photo-cards" ? (
            <PhotoCards items={panel.items} onNavigate={onNavigate} />
          ) : panel?.kind === "metals" ? (
            <MetalRow items={panel.items} onNavigate={onNavigate} />
          ) : panel?.kind === "links" ? (
            <LinkGrid items={panel.items} onNavigate={onNavigate} />
          ) : item.layout === "cards" ? (
            <CardGrid item={item} onNavigate={onNavigate} />
          ) : item.layout === "gifts" ? (
            <GiftGrid item={item} onNavigate={onNavigate} />
          ) : (
            <LinkGrid items={item.links} onNavigate={onNavigate} />
          )}
        </div>
        {item.layout !== "cards" ? (
          <Banner item={item} onNavigate={onNavigate} />
        ) : null}
      </div>

      <Promo item={item} onNavigate={onNavigate} />
    </div>
  );
}

function OptionRow({
  link,
  onNavigate,
}: {
  link: MegaLink;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-neutral-700 transition hover:bg-[#faf7f5] hover:text-[#8b2e2e]"
    >
      {link.swatch ? (
        <span
          className="size-8 shrink-0 rounded-full border border-neutral-200"
          style={{ backgroundColor: link.swatch }}
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f3eee8]">
          <JewelleryLineIcon
            label={link.label}
            className="size-[22px] text-[#6b3f32]"
          />
        </span>
      )}
      <span className="font-serif text-[14px] leading-snug">{link.label}</span>
    </Link>
  );
}

function LinkGrid({
  items,
  onNavigate,
}: {
  items: MegaLink[];
  onNavigate: () => void;
}) {
  const columns = splitColumns(items, 3);
  return (
    <div className="grid grid-cols-3 items-start gap-x-6">
      {columns.map((column, index) => (
        <div key={index} className="flex flex-col gap-1">
          {column.map((link) => (
            <OptionRow key={link.label} link={link} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PhotoCards({
  items,
  onNavigate,
}: {
  items: MegaLink[];
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={onNavigate}
          className="group text-center"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#faf6f0]">
            <Image
              src={item.image}
              alt={item.label}
              fill
              className="object-cover object-top transition duration-500 group-hover:scale-105"
              sizes="160px"
            />
          </div>
          <p className="mt-2 text-[13px] text-neutral-800">{item.label}</p>
        </Link>
      ))}
    </div>
  );
}

function MetalRow({
  items,
  onNavigate,
}: {
  items: MegaLink[];
  onNavigate: () => void;
}) {
  return (
    <div className="flex gap-10 pt-2">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={onNavigate}
          className="flex items-center gap-3 text-[13px] text-neutral-700 hover:text-[#8b2e2e]"
        >
          <span
            className="size-8 rounded-full border border-neutral-200"
            style={{ backgroundColor: item.swatch }}
          />
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function CardGrid({
  item,
  onNavigate,
}: {
  item: MegaMenuItem;
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {item.links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={onNavigate}
          className="group text-center"
        >
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f4f1ec]">
            <Image
              src={link.image}
              alt={link.label}
              fill
              className="object-cover object-top transition duration-500 group-hover:scale-105"
              sizes="140px"
            />
          </div>
          <p className="mt-2 text-[13px] text-neutral-800">{link.label}</p>
        </Link>
      ))}
    </div>
  );
}

function GiftGrid({
  item,
  onNavigate,
}: {
  item: MegaMenuItem;
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {item.links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={onNavigate}
          className="group text-center"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#f4f1ec]">
            <Image
              src={link.image}
              alt={link.label}
              fill
              className="object-cover object-top transition duration-500 group-hover:scale-105"
              sizes="180px"
            />
          </div>
          <p className="mt-2 text-[13px] font-medium text-neutral-800">
            {link.label}
          </p>
        </Link>
      ))}
    </div>
  );
}

function Banner({
  item,
  onNavigate,
}: {
  item: MegaMenuItem;
  onNavigate: () => void;
}) {
  return (
    <div className="mt-5 flex items-center gap-4 rounded-md bg-[#f6ead7] px-4 py-2.5">
      <div className="flex -space-x-2">
        {item.banner.thumbs.map((thumb) => (
          <span
            key={thumb}
            className="relative size-9 overflow-hidden rounded-md border border-white bg-white"
          >
            <Image src={thumb} alt="" fill className="object-contain p-0.5" sizes="36px" />
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm text-neutral-900">{item.banner.title}</p>
        <p className="text-xs text-neutral-500">{item.banner.subtitle}</p>
      </div>
      <Link
        href={item.banner.href}
        onClick={onNavigate}
        className="shrink-0 rounded-full bg-[#8b2e2e] px-5 py-2 text-xs text-white"
      >
        View All
      </Link>
    </div>
  );
}

function Promo({
  item,
  onNavigate,
}: {
  item: MegaMenuItem;
  onNavigate: () => void;
}) {
  return (
    <div className="border-l border-neutral-100 p-4">
      <Link href={item.promo.href} onClick={onNavigate} className="block">
        <div className="relative h-44 overflow-hidden bg-[#f4f1ec]">
          <Image
            src={item.promo.image}
            alt={item.promo.title}
            fill
            className="object-cover object-top"
            sizes="220px"
          />
        </div>
        <p className="mt-3 font-serif text-sm leading-snug text-neutral-900">
          {item.promo.title}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[13px] text-[#8b2e2e]">
          {item.promo.cta}
          <ArrowUpRight className="size-3.5" />
        </span>
      </Link>
    </div>
  );
}

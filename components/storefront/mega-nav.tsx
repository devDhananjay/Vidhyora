"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { MEGA_MENU, type MegaLink, type MegaMenuItem } from "@/lib/nav/mega-menu-data";
import { cn } from "@/lib/utils";
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

function resolvePanel(item: MegaMenuItem, sidebar: string) {
  const panel = item.panels?.[sidebar];
  if (panel) return panel;
  // Default "Category" / first tab → product links
  if (sidebar === item.sidebar[0] || sidebar === "Category" || sidebar === "Gifts for") {
    return {
      kind: (item.layout === "cards"
        ? "photo-cards"
        : item.layout === "gifts"
          ? "photo-cards"
          : "links") as MegaPanelKind,
      items: item.links,
    };
  }
  return null;
}

type MegaPanelKind = "links" | "photo-cards" | "metals";

export function MegaNav({
  disabled = false,
  mobileOnly = false,
  desktopOnly = false,
}: {
  disabled?: boolean;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState("Category");
  const [panelTop, setPanelTop] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const [mobileSidebar, setMobileSidebar] = useState("Category");
  const closeTimer = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const active =
    !disabled && openId
      ? (MEGA_MENU.find((item) => item.id === openId) ?? null)
      : null;

  const mobileActive = mobileOpenId
    ? (MEGA_MENU.find((item) => item.id === mobileOpenId) ?? null)
    : null;

  function measurePanelTop() {
    const el = barRef.current;
    if (!el) return;
    setPanelTop(el.getBoundingClientRect().bottom);
  }

  function open(id: string) {
    if (disabled) return;
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    const item = MEGA_MENU.find((entry) => entry.id === id);
    setSidebar(item?.sidebar[0] ?? "Category");
    measurePanelTop();
    setOpenId(id);
  }

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenId(null), 160);
  }

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (disabled) setOpenId(null);
  }, [disabled]);

  useLayoutEffect(() => {
    if (!openId) return;
    measurePanelTop();
    function onReposition() {
      measurePanelTop();
    }
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, { passive: true });
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition);
    };
  }, [openId]);

  const mobileStrip = (
    <div className="border-t border-neutral-100">
      <div className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MEGA_MENU.map((item) => {
          const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS];
          const selected = mobileOpenId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (mobileOpenId === item.id) {
                  setMobileOpenId(null);
                  return;
                }
                setMobileSidebar(item.sidebar[0] ?? "Category");
                setMobileOpenId(item.id);
              }}
              className={cn(
                "flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-lg px-1.5 py-1.5 transition sm:min-w-[72px] sm:px-2",
                selected
                  ? "bg-[#8b2e2e]/10 text-[#8b2e2e]"
                  : "text-[#8b2e2e] hover:bg-[#8b2e2e]/5",
              )}
            >
              <Icon className="size-5 text-[#8b2e2e]" />
              <span className="max-w-[4.5rem] truncate text-center text-[8px] font-semibold tracking-[0.06em] text-[#8b2e2e] uppercase sm:max-w-none sm:text-[9px] sm:tracking-[0.08em]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {mobileActive ? (
        <div className="border-t border-neutral-100 bg-white px-3 pb-4 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mobileActive.sidebar.map((tab) => {
              const selected = mobileSidebar === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMobileSidebar(tab)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[12px]",
                    selected
                      ? "bg-[#8b2e2e] text-white"
                      : "bg-[#f6ebe8] text-[#8b2e2e]",
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <MobileOptions
            item={mobileActive}
            sidebar={mobileSidebar}
            onNavigate={() => setMobileOpenId(null)}
          />
          <Link
            href={mobileActive.href}
            onClick={() => setMobileOpenId(null)}
            className="mt-3 flex items-center justify-center gap-1 rounded-full bg-[#8b2e2e] px-4 py-2.5 text-[13px] text-white"
          >
            View all {mobileActive.label}
            <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );

  if (mobileOnly) return mobileStrip;

  const panel =
    mounted && active
      ? createPortal(
          <div
            className="fixed inset-x-0 z-[60]"
            style={{ top: panelTop }}
            onMouseEnter={() => open(active.id)}
            onMouseLeave={scheduleClose}
          >
            <div className="border-t border-neutral-100 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
              <MegaPanel
                item={active}
                sidebar={sidebar}
                setSidebar={setSidebar}
                onNavigate={() => setOpenId(null)}
              />
            </div>
            <div className="h-[40vh] bg-black/25" onClick={() => setOpenId(null)} />
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={barRef}
      className={cn(
        "relative border-t border-neutral-100",
        desktopOnly ? "block" : "hidden md:block",
      )}
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
              onFocus={() => open(item.id)}
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
      {panel}
    </div>
  );
}

function MobileOptions({
  item,
  sidebar,
  onNavigate,
}: {
  item: MegaMenuItem;
  sidebar: string;
  onNavigate: () => void;
}) {
  const panel = resolvePanel(item, sidebar);
  if (!panel) {
    return (
      <p className="py-4 text-sm text-neutral-500">No options in this section yet.</p>
    );
  }
  if (panel.kind === "metals") {
    return <MetalRow items={panel.items} onNavigate={onNavigate} />;
  }
  if (panel.kind === "photo-cards") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {panel.items.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className="rounded-xl bg-[#faf7f5] p-3 text-center"
          >
            <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-white">
              <JewelleryLineIcon label={link.label} className="size-6 text-[#6b3f32]" />
            </span>
            <span className="text-[13px] text-neutral-800">{link.label}</span>
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1">
      {panel.items.map((link) => (
        <OptionRow key={link.label} link={link} onNavigate={onNavigate} />
      ))}
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
  const panel = resolvePanel(item, sidebar);

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-[200px_minmax(0,1fr)_230px] items-stretch">
      <aside className="border-r border-neutral-100 py-4 pr-3">
        {item.sidebar.map((tab) => {
          const selected = sidebar === tab;
          return (
            <button
              key={tab}
              type="button"
              onMouseEnter={() => setSidebar(tab)}
              onClick={() => setSidebar(tab)}
              className={`flex w-full items-center justify-between rounded-r-lg px-4 py-2.5 text-left text-[13px] transition ${
                selected
                  ? "bg-[#f6ebe8] font-medium text-[#8b2e2e] shadow-[inset_3px_0_0_#8b2e2e]"
                  : "text-neutral-700 hover:bg-[#faf7f5]"
              }`}
            >
              <span>{tab}</span>
              {selected ? <ChevronRight className="size-4 text-[#8b2e2e]" /> : null}
            </button>
          );
        })}
      </aside>

      <div className="flex min-h-[320px] flex-col justify-between px-6 py-5">
        <div>
          {!panel ? (
            <p className="text-sm text-neutral-500">No options in this section yet.</p>
          ) : panel.kind === "photo-cards" ? (
            <PhotoCards items={panel.items} onNavigate={onNavigate} />
          ) : panel.kind === "metals" ? (
            <MetalRow items={panel.items} onNavigate={onNavigate} />
          ) : (
            <LinkGrid items={panel.items} onNavigate={onNavigate} />
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
    <div className="flex flex-wrap gap-4 pt-2 sm:gap-10">
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

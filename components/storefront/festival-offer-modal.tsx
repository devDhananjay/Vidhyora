"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { HomepageFestivalOffer } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "vidyora-festival-offer:";

function dismissKey(offerId: string) {
  return `${STORAGE_PREFIX}${offerId}`;
}

/** Local calendar day in Asia/Kolkata (avoids UTC midnight reset). */
function istDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function wasDismissed(offer: HomepageFestivalOffer): boolean {
  try {
    if (offer.frequency === "session") {
      return sessionStorage.getItem(dismissKey(offer.id)) === "1";
    }
    const raw = localStorage.getItem(dismissKey(offer.id));
    if (!raw) return false;
    if (offer.frequency === "once") return true;
    if (offer.frequency === "daily") {
      return raw === istDayKey();
    }
  } catch {
    /* private mode */
  }
  return false;
}

function markDismissed(offer: HomepageFestivalOffer) {
  try {
    if (offer.frequency === "session") {
      sessionStorage.setItem(dismissKey(offer.id), "1");
      return;
    }
    if (offer.frequency === "daily") {
      localStorage.setItem(dismissKey(offer.id), istDayKey());
      return;
    }
    localStorage.setItem(dismissKey(offer.id), "1");
  } catch {
    /* ignore */
  }
}

function Polaroid({
  src,
  alt,
  rotate,
  className,
}: {
  src: string;
  alt: string;
  rotate: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[3px] bg-white p-1.5 shadow-[0_10px_28px_rgba(43,26,22,0.22)] ring-1 ring-black/5",
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#efe6da]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="120px"
        />
      </div>
    </div>
  );
}

export function FestivalOfferModal({
  offer,
}: {
  offer: HomepageFestivalOffer;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (wasDismissed(offer)) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      requestAnimationFrame(() => setVisible(true));
      window.dispatchEvent(
        new CustomEvent("vidyora:festival-modal", { detail: { open: true } }),
      );
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [offer]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setVisible(false);
    markDismissed(offer);
    window.dispatchEvent(
      new CustomEvent("vidyora:festival-modal", { detail: { open: false } }),
    );
    window.setTimeout(() => setOpen(false), 180);
  }

  if (!mounted || !open) return null;

  const imgs = offer.images;
  const rot = (i: number, fallback: number) => imgs[i]?.rotate ?? fallback;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-6 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="festival-offer-title"
    >
      <button
        type="button"
        aria-label="Close offer"
        className={cn(
          "absolute inset-0 bg-[#1a100e]/60 backdrop-blur-[3px] transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={close}
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-[640px] transition duration-200 ease-out",
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        <div
          className="relative z-0 overflow-hidden rounded-[1.75rem] shadow-[0_32px_90px_rgba(43,26,22,0.4)]"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, #fffaf3 0%, #f4ebe0 55%, #efe4d6 100%)",
          }}
        >
          {/* Soft vignette / atmosphere */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(139,46,46,0.06), transparent 42%), radial-gradient(circle at 80% 80%, rgba(180,140,60,0.08), transparent 45%)",
            }}
          />

          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute top-3.5 right-3.5 z-20 flex size-9 items-center justify-center rounded-full bg-white/85 text-[#5c4038] shadow-sm ring-1 ring-[#2b1a16]/8 transition hover:bg-white"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>

          <div className="relative px-5 pt-11 pb-8 sm:px-14 sm:pt-14 sm:pb-11 md:px-24">
            {/* Mobile image strip */}
            <div className="mb-5 flex justify-center gap-2 md:hidden">
              {imgs.slice(0, 4).map((img, i) => (
                <Polaroid
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  rotate={rot(i, i % 2 === 0 ? -5 : 5)}
                  className="w-14 shrink-0"
                />
              ))}
            </div>

            <div className="mx-auto max-w-[22rem] text-center sm:max-w-md">
              <p className="text-[10px] font-medium tracking-[0.22em] text-[#8b2e2e]/80 uppercase">
                VIDYORA
              </p>
              <h2
                id="festival-offer-title"
                className="mt-2 font-serif text-[1.75rem] leading-[1.15] text-[#6b1f1f] sm:text-[2.15rem]"
              >
                {offer.title}
              </h2>
              <span
                aria-hidden
                className="mx-auto mt-4 block h-px w-10 bg-[#8b2e2e]/35"
              />
              <p className="mt-4 text-[13px] leading-relaxed text-[#5c4038] sm:text-[15px]">
                {offer.subtitle}{" "}
                <span
                  className="inline-block rounded px-1.5 py-0.5 font-medium text-[#5c3d0a]"
                  style={{
                    background: "linear-gradient(180deg, #f7e9b0, #efd98a)",
                  }}
                >
                  {offer.highlight}
                </span>
              </p>

              <div className="mt-8 grid grid-cols-2 gap-2.5">
                {offer.budgets.map((budget, index) => {
                  const fullWidth =
                    offer.budgets.length % 2 === 1 &&
                    index === offer.budgets.length - 1;
                  return (
                    <Link
                      key={budget.id}
                      href={budget.href}
                      onClick={close}
                      className={cn(
                        "rounded-full border border-[#8b2e2e]/25 bg-white/90 px-3 py-3 text-center text-[12px] font-medium tracking-wide text-[#8b2e2e] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:border-[#8b2e2e] hover:bg-[#8b2e2e] hover:text-white hover:shadow-md active:scale-[0.98] sm:px-4 sm:text-sm",
                        fullWidth &&
                          "col-span-2 mx-auto w-[calc(50%-0.3125rem)]",
                      )}
                    >
                      {budget.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Polaroids after the card so they sit on top of the modal */}
        <div className="pointer-events-none absolute inset-y-0 -left-2 z-30 hidden w-[7.5rem] md:block lg:-left-4">
          {imgs[0] ? (
            <Polaroid
              src={imgs[0].src}
              alt={imgs[0].alt}
              rotate={rot(0, -9)}
              className="absolute top-8 left-0 w-[5.75rem]"
            />
          ) : null}
          {imgs[1] ? (
            <Polaroid
              src={imgs[1].src}
              alt={imgs[1].alt}
              rotate={rot(1, 7)}
              className="absolute bottom-10 left-3 w-[5.25rem]"
            />
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-y-0 -right-2 z-30 hidden w-[7.5rem] md:block lg:-right-4">
          {imgs[2] ? (
            <Polaroid
              src={imgs[2].src}
              alt={imgs[2].alt}
              rotate={rot(2, 8)}
              className="absolute top-12 right-0 w-[5.75rem]"
            />
          ) : null}
          {imgs[3] ? (
            <Polaroid
              src={imgs[3].src}
              alt={imgs[3].alt}
              rotate={rot(3, -6)}
              className="absolute right-2 bottom-8 w-[5.25rem]"
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Hand, Ruler, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SizeGuideDialog } from "@/components/products/size-guide-dialog";
import { LiveTryOnButton } from "@/components/products/live-try-on";

type OnModelShot = {
  id: string;
  url: string;
  altText?: string | null;
};

type HowItSitsAidProps = {
  productName: string;
  categoryName?: string | null;
  onModelImages?: OnModelShot[];
  tryOnImageUrl?: string | null;
  className?: string;
};

function detectJewelleryKind(name: string, category?: string | null) {
  const hay = `${name} ${category || ""}`.toLowerCase();
  if (/ring|band/.test(hay)) return "ring" as const;
  if (/bangle|bracelet|kada/.test(hay)) return "bangle" as const;
  if (/earring|jhumka|stud|hoop/.test(hay)) return "earring" as const;
  if (/necklace|chain|pendant|haar/.test(hay)) return "necklace" as const;
  if (/nose|nath/.test(hay)) return "nose" as const;
  return "jewellery" as const;
}

const TIPS: Record<
  ReturnType<typeof detectJewelleryKind>,
  { title: string; points: string[] }
> = {
  ring: {
    title: "How a ring sits",
    points: [
      "It should pass the knuckle snugly, then rest without spinning.",
      "Finger size changes with heat — measure at end of day.",
      "Heavy stone rings sit lower; thin bands sit closer to the knuckle.",
    ],
  },
  bangle: {
    title: "How a bangle sits",
    points: [
      "Slip over the widest part of the hand, then settle on the wrist bone.",
      "You should fit two fingers between wrist and bangle for comfort.",
      "Stack lighter pieces above heavier kada styles.",
    ],
  },
  earring: {
    title: "How earrings sit",
    points: [
      "Jhumkas drop from the lobe — check length against jawline in photos.",
      "Studs sit flush; hoops frame the face — match metal to skin tone.",
      "Heavy pairs need secure backs; try for 5 minutes before buying.",
    ],
  },
  necklace: {
    title: "How a necklace sits",
    points: [
      "Chokers hug the collarbone; princess length sits above the bust.",
      "Pendant drop is measured from clasp to stone tip.",
      "Layer finer chains above statement pieces.",
    ],
  },
  nose: {
    title: "How a nose pin sits",
    points: [
      "Screw / wire backs should feel secure without pinching.",
      "Stone faces outward; check left/right listing photos.",
      "Keep spare backs for daily wear pieces.",
    ],
  },
  jewellery: {
    title: "How it sits on you",
    points: [
      "Use on-model shots below to judge scale against skin and outfit.",
      "Open the size guide for rings, bangles and chains.",
      "When unsure, message the seller with your wrist / finger size.",
    ],
  },
};

export function HowItSitsAid({
  productName,
  categoryName,
  onModelImages = [],
  tryOnImageUrl,
  className,
}: HowItSitsAidProps) {
  const kind = useMemo(
    () => detectJewelleryKind(productName, categoryName),
    [productName, categoryName],
  );
  const tip = TIPS[kind];
  const [sizeOpen, setSizeOpen] = useState(false);
  const [activeShot, setActiveShot] = useState(0);
  const shot = onModelImages[activeShot] || onModelImages[0];
  const overlayUrl =
    tryOnImageUrl ||
    onModelImages[0]?.url ||
    null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-neutral-200 bg-white",
        className,
      )}
    >
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative min-h-[240px] bg-[#f4efea] md:min-h-[320px]">
          {shot ? (
            <Image
              src={shot.url}
              alt={shot.altText || `${productName} on model`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-white text-[#8b2e2e] shadow-sm">
                <Hand className="size-6" strokeWidth={1.5} />
              </span>
              <p className="font-serif text-xl text-neutral-800">
                Try-on preview
              </p>
              <p className="max-w-xs text-sm text-neutral-500">
                On-model photos will appear here when the seller adds them.
                Or try it on live with your camera.
              </p>
              {overlayUrl ? (
                <LiveTryOnButton
                  productName={productName}
                  imageUrl={overlayUrl}
                  jewelleryKind={kind}
                  className="mt-1"
                />
              ) : null}
            </div>
          )}
          {onModelImages.length > 1 ? (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {onModelImages.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveShot(index)}
                  className={cn(
                    "h-1.5 rounded-full transition",
                    index === activeShot ? "w-5 bg-white" : "w-1.5 bg-white/50",
                  )}
                  aria-label={`On-model photo ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-center px-5 py-6 md:px-8 md:py-8">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] text-[#8b2e2e] uppercase">
            <Sparkles className="size-3.5" strokeWidth={1.7} />
            How it sits
          </p>
          <h2 className="mt-2 font-serif text-2xl text-neutral-900 md:text-3xl">
            {tip.title}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {tip.points.map((point) => (
              <li
                key={point}
                className="flex gap-2 text-sm leading-relaxed text-neutral-600"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#c5a46e]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSizeOpen(true)}
              className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-[#8b2e2e]/25 bg-[#faf4f0] px-5 text-sm font-medium text-[#8b2e2e] transition hover:bg-[#f3ebe4]"
            >
              <Ruler className="size-4" strokeWidth={1.7} />
              Open size guide
            </button>
            {overlayUrl ? (
              <LiveTryOnButton
                productName={productName}
                imageUrl={overlayUrl}
                jewelleryKind={kind}
                className="h-11"
              />
            ) : null}
          </div>
        </div>
      </div>

      <SizeGuideDialog open={sizeOpen} onOpenChange={setSizeOpen} />
    </section>
  );
}

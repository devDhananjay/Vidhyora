"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SizeGuideDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS = [
  { id: "ring", label: "Rings" },
  { id: "bangle", label: "Bangles" },
  { id: "chain", label: "Chains" },
] as const;

const RING_ROWS = [
  { india: "8", us: "4.5", mm: "48.0", inch: "1.89" },
  { india: "10", us: "5.5", mm: "50.0", inch: "1.97" },
  { india: "12", us: "6.5", mm: "52.0", inch: "2.05" },
  { india: "14", us: "7.5", mm: "54.0", inch: "2.13" },
  { india: "16", us: "8", mm: "56.0", inch: "2.20" },
  { india: "18", us: "9", mm: "58.0", inch: "2.28" },
  { india: "20", us: "10", mm: "60.0", inch: "2.36" },
];

const BANGLE_ROWS = [
  { size: "2-2", mm: "54", tip: "Petite wrist" },
  { size: "2-4", mm: "57", tip: "Most common women" },
  { size: "2-6", mm: "60", tip: "Medium wrist" },
  { size: "2-8", mm: "63", tip: "Larger wrist" },
  { size: "2-10", mm: "66", tip: "XL / stack wear" },
];

const CHAIN_ROWS = [
  { length: '16"', use: "Choker / close neck" },
  { length: '18"', use: "Everyday pendant" },
  { length: '20"', use: "Layering / longer drop" },
  { length: '22–24"', use: "Statement / traditional" },
];

export function SizeGuideDialog({ open, onOpenChange }: SizeGuideDialogProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ring");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-[24px] p-0 sm:rounded-[28px]">
        <DialogHeader className="border-b border-[#ead9c4]/70 bg-[#fffcf8] px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl font-normal text-brand">
            <Ruler className="size-5 text-[#8b2e2e]" strokeWidth={1.7} />
            Size guide
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600">
            Measure at home and match to Indian jewellery sizes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 border-b border-neutral-100 px-6 py-2.5">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                tab === item.id
                  ? "bg-[#8b2e2e] text-white"
                  : "bg-[#f6ebe8] text-[#8b2e2e] hover:bg-[#efdfd9]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="max-h-[min(60vh,420px)] space-y-4 overflow-y-auto px-6 py-5">
          {tab === "ring" ? (
            <>
              <p className="text-sm leading-relaxed text-neutral-600">
                Wrap a paper strip around your finger, mark the overlap, and
                measure in mm. Match the inner circumference below.
              </p>
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">India</th>
                      <th className="px-3 py-2.5 font-medium">US</th>
                      <th className="px-3 py-2.5 font-medium">mm</th>
                      <th className="px-3 py-2.5 font-medium">inch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RING_ROWS.map((row) => (
                      <tr key={row.india} className="border-t border-neutral-100">
                        <td className="px-3 py-2.5 font-medium text-neutral-900">
                          {row.india}
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600">{row.us}</td>
                        <td className="px-3 py-2.5 text-neutral-600">{row.mm}</td>
                        <td className="px-3 py-2.5 text-neutral-600">
                          {row.inch}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {tab === "bangle" ? (
            <>
              <p className="text-sm leading-relaxed text-neutral-600">
                Measure the widest part of your hand (across knuckles) with a
                soft tape. Indian bangle sizes use the 2-X format.
              </p>
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Size</th>
                      <th className="px-3 py-2.5 font-medium">Diameter</th>
                      <th className="px-3 py-2.5 font-medium">Fit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BANGLE_ROWS.map((row) => (
                      <tr key={row.size} className="border-t border-neutral-100">
                        <td className="px-3 py-2.5 font-medium text-neutral-900">
                          {row.size}
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600">
                          {row.mm} mm
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600">
                          {row.tip}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {tab === "chain" ? (
            <>
              <p className="text-sm leading-relaxed text-neutral-600">
                Chain length is measured end-to-end including clasp. When in
                doubt, go one size longer for layering.
              </p>
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Length</th>
                      <th className="px-3 py-2.5 font-medium">Best for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHAIN_ROWS.map((row) => (
                      <tr
                        key={row.length}
                        className="border-t border-neutral-100"
                      >
                        <td className="px-3 py-2.5 font-medium text-neutral-900">
                          {row.length}
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600">
                          {row.use}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

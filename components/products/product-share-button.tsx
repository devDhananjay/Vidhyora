"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Share2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

type ProductShareButtonProps = {
  title: string;
  text?: string;
};

export function ProductShareButton({ title, text }: ProductShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  useEffect(() => {
    if (open) {
      setUrl(window.location.href);
      setCopied(false);
    }
  }, [open]);

  async function copyLink() {
    const link = url || window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link:", link);
    }
  }

  async function nativeShare() {
    const link = url || window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: text || `Check out ${title} on VIDYORA`,
          url: link,
        });
        setOpen(false);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Share product"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#8b2e2e] transition hover:border-[#8b2e2e]/40 hover:bg-[#8b2e2e]/5"
        >
          <Share2 className="size-5" strokeWidth={1.7} />
        </button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[101] w-[min(100%-1.5rem,400px)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-2xl outline-none sm:p-7"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X className="size-4" />
            </button>
          </DialogClose>

          <div className="flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#8b2e2e]/10">
              <Link2 className="size-5 text-[#8b2e2e]" strokeWidth={1.6} />
            </div>
            <DialogTitle className="mt-3 font-serif text-xl text-neutral-900 sm:text-2xl">
              Share this jewellery
            </DialogTitle>
            <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-neutral-500">
              Copy the link and share {title} with someone special.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-neutral-200 bg-[#faf7f5] px-3.5 py-3">
              <Link2
                className="size-4 shrink-0 text-[#8b2e2e]"
                strokeWidth={1.7}
              />
              <p className="min-w-0 flex-1 truncate text-left text-sm text-neutral-600">
                {url || "…"}
              </p>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition",
                copied
                  ? "bg-[#2f6b4f] text-white"
                  : "bg-[#8b2e2e] text-white hover:bg-[#7a2727]",
              )}
            >
              {copied ? (
                <>
                  <Check className="size-4" strokeWidth={2} />
                  Link copied
                </>
              ) : (
                <>
                  <Copy className="size-4" strokeWidth={1.8} />
                  Copy Link
                </>
              )}
            </button>

            {canNativeShare ? (
              <button
                type="button"
                onClick={nativeShare}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:border-[#8b2e2e]/35 hover:text-[#8b2e2e]"
              >
                <Share2 className="size-4" strokeWidth={1.7} />
                More share options
              </button>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

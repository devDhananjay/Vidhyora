"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  enableWishlistShare,
  disableWishlistShare,
} from "@/actions/wishlist/manage-wishlist";
import { appAlert } from "@/components/shared/app-dialog";

type WishlistShareButtonProps = {
  initialShareToken?: string | null;
};

export function WishlistShareButton({
  initialShareToken,
}: WishlistShareButtonProps) {
  const [token, setToken] = useState(initialShareToken || "");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      setUrl("");
      return;
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    setUrl(`${origin}/w/${token}`);
  }, [token]);

  function createLink() {
    startTransition(async () => {
      const result = await enableWishlistShare();
      if (!result.success) {
        await appAlert(result.error, { variant: "error" });
        return;
      }
      setToken(result.data.shareToken);
      setUrl(result.data.shareUrl);
    });
  }

  async function copy() {
    const link = url || `${window.location.origin}/w/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy share link:", link);
    }
  }

  async function nativeShare() {
    const link = url || `${window.location.origin}/w/${token}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "My VIDYORA wishlist",
          text: "Jewellery I'm loving on VIDYORA",
          url: link,
        });
      } else {
        await copy();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  function turnOff() {
    startTransition(async () => {
      const result = await disableWishlistShare();
      if (!result.success) {
        await appAlert(result.error, { variant: "error" });
        return;
      }
      setToken("");
      setUrl("");
    });
  }

  if (!token) {
    return (
      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-full"
        onClick={createLink}
        disabled={pending}
      >
        <Share2 className="size-4" />
        {pending ? "Creating…" : "Share wishlist"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-full"
        onClick={nativeShare}
        disabled={pending}
      >
        <Share2 className="size-4" />
        Share
      </Button>
      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-full"
        onClick={copy}
        disabled={pending}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <button
        type="button"
        onClick={turnOff}
        disabled={pending}
        className="inline-flex items-center gap-1 text-xs text-neutral-500 underline-offset-2 hover:text-[#8b2e2e] hover:underline"
      >
        <Link2 className="size-3.5" />
        Stop sharing
      </button>
    </div>
  );
}

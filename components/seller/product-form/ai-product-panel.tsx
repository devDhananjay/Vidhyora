"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Send, Sparkles, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, slugify } from "@/lib/utils";
import { uploadProductImage } from "@/actions/seller/upload-product-image";
import {
  analyzeProductImageForListing,
  getAiProductAssistStatus,
  refineProductListingDraft,
} from "@/actions/seller/ai-product-assist";
import type { AiChatMessage, AiProductDraft } from "@/lib/validations/ai-product-draft";
import type { CreateProductInput } from "@/lib/validations/product";

const MAX_AI_IMAGES = 3;

type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

type ChatBubble = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type AiProductPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  onApply: (values: Partial<CreateProductInput>) => void;
};

function draftToFormValues(
  draft: AiProductDraft,
  imageUrls: string[],
): Partial<CreateProductInput> {
  const name = draft.name.trim();
  const price =
    typeof draft.suggestedPrice === "number" && draft.suggestedPrice >= 0
      ? draft.suggestedPrice
      : 0;
  const stock =
    typeof draft.stock === "number" && draft.stock >= 0 ? draft.stock : 0;
  const sku = (
    draft.sku?.trim() ||
    `SKU-${slugify(name).slice(0, 12).toUpperCase() || "ITEM"}-${Date.now()
      .toString(36)
      .slice(-4)
      .toUpperCase()}`
  ).slice(0, 50);

  const attributes: Record<string, string> = {
    ...(draft.attributes || {}),
  };
  if (draft.makingChargePercent) {
    attributes.makingChargePercent = draft.makingChargePercent;
  }
  if (draft.metalRatePerGram) {
    attributes.metalRatePerGram = draft.metalRatePerGram;
  }

  const variantAttributes: Record<string, string> = {};
  if (draft.variantLabel) {
    variantAttributes.name = draft.variantLabel;
  }

  const images = imageUrls.slice(0, MAX_AI_IMAGES).map((url, index) => ({
    url,
    altText: draft.imageAltText || name,
    sortOrder: index,
  }));

  return {
    name,
    slug: slugify(name),
    brand: (draft.brand || "VIDYORA").trim(),
    categoryId: draft.categoryId || "",
    shortDescription: draft.shortDescription.trim(),
    description: draft.description.trim(),
    thumbnail: images[0]?.url || "",
    images,
    variants: [
      {
        sku,
        attributes: variantAttributes,
        price,
        compareAtPrice:
          typeof draft.compareAtPrice === "number" && draft.compareAtPrice > 0
            ? draft.compareAtPrice
            : undefined,
        stock,
        isActive: true,
      },
    ],
    basePrice: price,
    hsn: draft.hsn || "711319",
    certificateNumber: draft.certificateNumber || "",
    tax: 3,
    attributes,
  };
}

export function AiProductPanel({
  open,
  onOpenChange,
  categories,
  onApply,
}: AiProductPanelProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [draft, setDraft] = useState<AiProductDraft | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const categoryPayload = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    [categories],
  );

  useEffect(() => {
    if (!open) return;
    getAiProductAssistStatus().then((res) => {
      if (res.success) setConfigured(res.data.configured);
      else setConfigured(false);
    });
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draft, isPending]);

  const resetPanel = () => {
    setImageUrls([]);
    setDraft(null);
    setMessages([]);
    setInput("");
    setError(null);
    setIsUploading(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetPanel();
    onOpenChange(next);
  };

  const pushAssistant = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}-${Math.random()}`,
        role: "assistant",
        content,
      },
    ]);
  };

  const runAnalyze = (urls: string[]) => {
    if (urls.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await analyzeProductImageForListing({
        imageUrls: urls,
        categories: categoryPayload,
      });
      if (!result.success) {
        setError(result.error);
        pushAssistant(
          result.error ||
            "I couldn't analyze those images. Try other photos or fill the form manually.",
        );
        return;
      }
      setDraft(result.data.draft);
      const questions = result.data.draft.questions?.filter(Boolean) || [];
      const extra =
        questions.length > 0
          ? `\n\nQuick questions:\n${questions.map((q) => `• ${q}`).join("\n")}`
          : "";
      pushAssistant(`${result.data.assistantMessage}${extra}`);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_AI_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${MAX_AI_IMAGES} images`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadProductImage(formData);
        if (!result.success) {
          throw new Error(result.error || "Upload failed");
        }
        uploaded.push(result.data.url);
      }

      const nextUrls = [...imageUrls, ...uploaded].slice(0, MAX_AI_IMAGES);
      setImageUrls(nextUrls);
      setDraft(null);
      setMessages([
        {
          id: `s-${Date.now()}`,
          role: "system",
          content:
            nextUrls.length > 1
              ? `${nextUrls.length} photos uploaded. Analyzing jewellery details…`
              : "Photo uploaded. Analyzing jewellery details…",
        },
      ]);
      runAnalyze(nextUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    const next = imageUrls.filter((u) => u !== url);
    setImageUrls(next);
    setDraft(null);
    setMessages([]);
    setError(null);
    if (next.length > 0) {
      setMessages([
        {
          id: `s-${Date.now()}`,
          role: "system",
          content: "Photo updated. Re-analyzing…",
        },
      ]);
      runAnalyze(next);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !draft || imageUrls.length === 0 || isPending) return;

    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text },
    ]);

    startTransition(async () => {
      const history: AiChatMessage[] = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const result = await refineProductListingDraft({
        imageUrls,
        draft,
        messages: history,
        userMessage: text,
        categories: categoryPayload,
      });

      if (!result.success) {
        setError(result.error);
        pushAssistant(result.error || "Something went wrong. Please try again.");
        return;
      }

      setDraft(result.data.draft);
      pushAssistant(result.data.assistantMessage);
    });
  };

  const handleApply = () => {
    if (!draft || imageUrls.length === 0) return;
    onApply(draftToFormValues(draft, imageUrls));
    handleOpenChange(false);
  };

  const busy = isUploading || isPending;
  const canAddMore = imageUrls.length < MAX_AI_IMAGES;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "fixed inset-y-0 right-0 left-auto top-0 z-[101] flex h-dvh max-h-dvh w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-l border-r-0 p-0 shadow-2xl sm:rounded-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          "sm:max-w-xl",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-100 px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl font-normal tracking-normal">
            <Sparkles className="size-5 text-[#8b2e2e]" />
            Add product with AI
          </DialogTitle>
          <DialogDescription>
            Upload up to 3 jewellery photos. I&apos;ll draft name, category, and
            descriptions — then we can refine pricing in chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {configured === false && (
            <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:mx-6">
              AI keys are not set on the server yet. Add{" "}
              <code className="text-xs">OPENAI_API_KEY</code> or{" "}
              <code className="text-xs">GEMINI_API_KEY</code> to enable analysis.
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            {imageUrls.length === 0 ? (
              <button
                type="button"
                disabled={busy || configured === false}
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-[#faf8f6] px-6 py-14 text-center transition hover:border-[#8b2e2e]/40 hover:bg-[#f6ebe8] disabled:opacity-60"
              >
                {isUploading ? (
                  <Loader2 className="size-8 animate-spin text-[#8b2e2e]" />
                ) : (
                  <Upload className="size-8 text-[#8b2e2e]" />
                )}
                <div>
                  <p className="font-medium text-neutral-900">
                    {isUploading ? "Uploading…" : "Upload product photos"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Up to {MAX_AI_IMAGES} images · JPG, PNG or WebP · 5MB each
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, index) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50"
                    >
                      <Image
                        src={url}
                        alt={`Product ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="160px"
                        unoptimized
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeImage(url)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-90 transition hover:bg-black/80 disabled:opacity-40"
                        aria-label="Remove image"
                      >
                        <X className="size-3.5" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                  {canAddMore && (
                    <button
                      type="button"
                      disabled={busy || configured === false}
                      onClick={() => fileRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 bg-[#faf8f6] text-neutral-600 transition hover:border-[#8b2e2e]/40 hover:bg-[#f6ebe8] disabled:opacity-60"
                    >
                      {isUploading ? (
                        <Loader2 className="size-5 animate-spin text-[#8b2e2e]" />
                      ) : (
                        <Upload className="size-5 text-[#8b2e2e]" />
                      )}
                      <span className="text-[11px] font-medium">
                        Add ({imageUrls.length}/{MAX_AI_IMAGES})
                      </span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {imageUrls.length}/{MAX_AI_IMAGES} photos · first image is the
                  main thumbnail
                </p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {draft && (
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-sm shadow-sm">
                <p className="text-xs font-medium tracking-wide text-[#8b2e2e] uppercase">
                  Draft preview
                </p>
                <p className="mt-2 font-medium text-neutral-900">{draft.name}</p>
                <p className="mt-1 text-muted-foreground">
                  {draft.categoryName ||
                    categories.find((c) => c.id === draft.categoryId)?.name ||
                    "Category pending"}
                  {draft.suggestedPrice != null
                    ? ` · ₹${draft.suggestedPrice.toLocaleString("en-IN")}`
                    : " · Price pending"}
                </p>
                <p className="mt-2 line-clamp-3 text-neutral-700">
                  {draft.shortDescription}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user" &&
                      "ml-auto bg-[#8b2e2e] text-white",
                    msg.role === "assistant" &&
                      "bg-neutral-100 text-neutral-800",
                    msg.role === "system" &&
                      "mx-auto bg-transparent text-center text-xs text-muted-foreground",
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isPending && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-3.5 py-2.5 text-sm text-neutral-600">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="shrink-0 space-y-3 border-t border-neutral-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  draft
                    ? "e.g. Price 45000, stock 5, category Earrings…"
                    : "Upload photos to start chatting"
                }
                disabled={!draft || busy}
                rows={2}
                className="min-h-[72px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="mt-auto size-10 shrink-0 bg-[#8b2e2e] hover:bg-[#742626]"
                disabled={!draft || !input.trim() || busy}
                onClick={handleSend}
              >
                <Send className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="sm:flex-1"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#8b2e2e] hover:bg-[#742626] sm:flex-1"
                disabled={!draft || imageUrls.length === 0 || busy}
                onClick={handleApply}
              >
                Apply to form
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

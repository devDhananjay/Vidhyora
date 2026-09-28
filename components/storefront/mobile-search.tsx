"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";
import { VoiceSearchButton } from "@/components/storefront/voice-search-button";
import { useVoiceSearch } from "@/lib/hooks/use-voice-search";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SuggestItem = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  priceLabel: string;
  image: string | null;
};

const POPULAR: Array<
  | { label: string; q: string; href?: never }
  | { label: string; href: string; q?: never }
> = [
  { label: "Gold necklace", q: "gold necklace" },
  { label: "Diamond rings", q: "diamond ring" },
  { label: "Earrings", q: "earrings" },
  { label: "Bridal", q: "bridal" },
  { label: "Under ₹50k", href: "/collections/under-50k" },
  { label: "Wedding", href: "/collections/wedding" },
];

export function MobileSearchButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Search jewellery"
        className={cn(
          "rounded-full p-2 text-brand hover:bg-brand/5 md:hidden",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" strokeWidth={1.5} />
      </button>
      {open ? (
        <MobileSearchOverlay onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function MobileSearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const voice = useVoiceSearch({
    onFinal: (transcript) => {
      setQuery(transcript);
      window.setTimeout(() => {
        onClose();
        router.push(`${ROUTES.search}?q=${encodeURIComponent(transcript)}`);
      }, 50);
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (voice.listening || q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q)}&limit=10`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("suggest failed");
        const data = (await res.json()) as { items?: SuggestItem[] };
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, voice.listening]);

  function goSearch(nextQuery = query) {
    const q = nextQuery.trim();
    if (!q) return;
    onClose();
    router.push(`${ROUTES.search}?q=${encodeURIComponent(q)}`);
  }

  function goProduct(slug: string) {
    onClose();
    router.push(`/products/${slug}`);
  }

  if (!mounted) return null;

  const trimmed = query.trim();
  const showResults = !voice.listening && trimmed.length >= 2;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex flex-col bg-[#faf8f6] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Search jewellery"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-white px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Close search"
          onClick={onClose}
          className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <form
          className="relative min-w-0 flex-1"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            goSearch();
          }}
        >
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={voice.listening && voice.interim ? voice.interim : query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              voice.listening ? "Listening… speak now" : "Search gold, diamond, rings…"
            }
            autoComplete="off"
            enterKeyHint="search"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-label="Search jewellery"
            className={cn(
              "h-11 w-full rounded-full border border-border bg-[#faf8f6] py-2 pr-20 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              voice.listening && "border-brand ring-2 ring-brand/15",
            )}
          />
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand">
            <Search className="size-4" strokeWidth={1.75} />
          </span>
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
            {trimmed ? (
              <button
                type="button"
                aria-label="Clear search"
                className="rounded-full p-1.5 text-brand/60 hover:bg-brand/5 hover:text-brand"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            ) : null}
            <VoiceSearchButton
              supported={voice.supported}
              listening={voice.listening}
              size="md"
              onToggle={() => {
                if (voice.listening) voice.stop();
                else voice.start();
              }}
            />
          </div>
        </form>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-1.5 text-sm font-medium text-[#8b2e2e]"
        >
          Cancel
        </button>
      </div>
      {voice.error ? (
        <p className="border-b border-border bg-white px-4 py-2 text-xs text-[#8b2e2e]">
          {voice.error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {voice.listening ? (
          <div className="px-4 pt-8 text-center">
            <p className="text-sm font-medium text-[#8b2e2e]">Listening…</p>
            <p className="mt-1 text-xs text-neutral-500">
              Speak a product name — results will open below
            </p>
          </div>
        ) : !showResults ? (
          <div className="px-4 pt-5">
            <p className="mb-3 text-[11px] tracking-[0.18em] text-[#c4a574] uppercase">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-800"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goSearch(item.q)}
                    className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-800"
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div id={listId} role="listbox" className="pt-1">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-500">Searching…</p>
            ) : items.length === 0 ? (
              <div className="px-4 py-6">
                <p className="text-sm text-neutral-600">
                  No matches for “{trimmed}”
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-[#8b2e2e]"
                  onClick={() => goSearch()}
                >
                  Search all jewellery
                </button>
              </div>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id} role="option">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[#f7f1ea]"
                      onClick={() => goProduct(item.slug)}
                    >
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#eef3f2]">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center font-serif text-xs text-neutral-400">
                            V
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-neutral-900">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">
                          {item.brand} · {item.priceLabel}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="mt-1 flex w-full items-center justify-between border-t border-neutral-100 bg-white px-4 py-3.5 text-left text-sm text-[#8b2e2e]"
              onClick={() => goSearch()}
            >
              <span>Search for “{trimmed}”</span>
              <Search className="size-4 opacity-70" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

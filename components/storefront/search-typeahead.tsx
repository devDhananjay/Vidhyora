"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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

type SearchTypeaheadProps = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  compact?: boolean;
};

export function SearchTypeahead({
  className,
  inputClassName,
  placeholder = "Search for gold necklace, diamond jewellery",
  compact = false,
}: SearchTypeaheadProps) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const suppressSuggestionsRef = useRef(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const voice = useVoiceSearch({
    onFinal: (transcript) => {
      suppressSuggestionsRef.current = true;
      setQuery(transcript);
      setOpen(false);
      setItems([]);
      window.setTimeout(() => {
        router.push(`${ROUTES.search}?q=${encodeURIComponent(transcript)}`);
      }, 50);
    },
  });

  useEffect(() => {
    if (voice.listening) {
      suppressSuggestionsRef.current = true;
      setOpen(false);
      setItems([]);
      setActiveIndex(-1);
    }
  }, [voice.listening]);

  useEffect(() => {
    const q = query.trim();
    if (suppressSuggestionsRef.current || voice.listening || q.length < 2) {
      if (suppressSuggestionsRef.current || voice.listening) {
        setItems([]);
        setOpen(false);
        setLoading(false);
        setActiveIndex(-1);
      } else if (q.length < 2) {
        setItems([]);
        setLoading(false);
        setActiveIndex(-1);
      }
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q)}&limit=8`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("suggest failed");
        if (suppressSuggestionsRef.current || voice.listening) return;
        const data = (await res.json()) as { items?: SuggestItem[] };
        setItems(Array.isArray(data.items) ? data.items : []);
        setOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, voice.listening]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goSearch(nextQuery = query) {
    const q = nextQuery.trim();
    if (!q) return;
    setOpen(false);
    router.push(`${ROUTES.search}?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      if (voice.listening) voice.stop();
      return;
    }
    if (!open || items.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        goSearch();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = activeIndex >= 0 ? items[activeIndex] : null;
      if (active) {
        setOpen(false);
        router.push(`/products/${active.slug}`);
        return;
      }
      goSearch();
    }
  }

  const showPanel =
    open &&
    !voice.listening &&
    !suppressSuggestionsRef.current &&
    query.trim().length >= 2;
  const displayValue = voice.listening && voice.interim ? voice.interim : query;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        action={ROUTES.search}
        onSubmit={(event) => {
          event.preventDefault();
          goSearch();
        }}
        className="relative"
        role="search"
      >
        <input
          type="search"
          name="q"
          value={displayValue}
          onChange={(event) => {
            suppressSuggestionsRef.current = false;
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (
              !suppressSuggestionsRef.current &&
              !voice.listening &&
              query.trim().length >= 2
            ) {
              setOpen(true);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder={voice.listening ? "Listening… speak now" : placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showPanel}
          aria-label="Search jewellery"
          className={cn(
            "h-10 w-full rounded-full border border-border bg-card py-2 pl-11 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-[padding,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-brand [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            compact && "h-9 pl-10 pr-11 shadow-sm",
            voice.listening && "border-brand ring-2 ring-brand/15",
            inputClassName,
          )}
        />
        <button
          type="submit"
          className={cn(
            "absolute top-1/2 left-2 inline-flex size-8 -translate-y-1/2 items-center justify-center text-brand hover:text-brand/80",
            compact && "left-1.5 size-7",
          )}
          aria-label="Search"
        >
          <Search className={cn("size-4", compact && "size-3.5")} strokeWidth={1.75} />
        </button>
        <div
          className={cn(
            "absolute top-1/2 right-1.5 -translate-y-1/2",
            compact && "right-1",
          )}
        >
          <VoiceSearchButton
            supported={voice.supported}
            listening={voice.listening}
            onToggle={() => {
              if (voice.listening) {
                voice.stop();
              } else {
                suppressSuggestionsRef.current = true;
                setOpen(false);
                setItems([]);
                voice.start();
              }
            }}
            size="sm"
          />
        </div>
      </form>

      {voice.error ? (
        <p className="mt-1.5 px-1 text-[11px] text-[#8b2e2e]">{voice.error}</p>
      ) : null}

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_18px_40px_rgba(43,26,22,0.14)]"
        >
          {loading && items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">Searching…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">
              No matches — press Enter to search all jewellery
            </p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto py-1">
              {items.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={`/products/${item.slug}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors",
                      index === activeIndex
                        ? "bg-[#f7f1ea]"
                        : "hover:bg-[#faf7f3]",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setOpen(false)}
                  >
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[#eef3f2]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center font-serif text-[10px] text-neutral-400">
                          V
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-neutral-900">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {item.brand} · {item.priceLabel}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="flex w-full items-center justify-between border-t border-neutral-100 px-4 py-2.5 text-left text-sm text-[#8b2e2e] hover:bg-[#faf7f3]"
            onClick={() => goSearch()}
          >
            <span>
              Search for “{query.trim()}”
            </span>
            <Search className="size-3.5 opacity-70" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

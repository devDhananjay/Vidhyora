"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  FileUp,
  Loader2,
  Minus,
  Paperclip,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import {
  getSupportChatBootstrap,
  getSupportChatThread,
  recommendSupportChatProducts,
  sendSupportChatMessage,
  startSupportChat,
  uploadSupportChatFile,
  type SupportChatMessageDto,
  type SupportChatProductCard,
  type SupportChatThreadDto,
} from "@/actions/support/support-chat";
import { useSupportChatRealtime } from "@/lib/hooks/use-support-chat-realtime";
import {
  GUIDE_CATEGORIES,
  GUIDE_OCCASIONS,
  GUIDE_RECOMMEND_ACTIONS,
  type GuideCategoryId,
  type GuideOccasionId,
  type GuideStep,
} from "@/lib/support-chat/guide";
import { cn, formatCurrency } from "@/lib/utils";

const STORAGE_KEY = "vidyora-support-chat-v2";
const LEGACY_STORAGE_KEY = "vidyora-support-chat-v1";
const BUBBLE_DISMISS_KEY = "vidyora-support-bubble-dismissed";
const CONCIERGE_AVATAR = "/brand/support-concierge.jpg";

type StoredGuide = {
  step: GuideStep;
  categoryId: GuideCategoryId | null;
  occasionId: GuideOccasionId | null;
  productOffset: number;
  loginDismissed: boolean;
  freeQuery?: string;
};

type StoredSession = {
  threadId: string;
  guestToken: string;
  guide?: StoredGuide;
};

const DEFAULT_GUIDE: StoredGuide = {
  step: "category",
  categoryId: null,
  occasionId: null,
  productOffset: 0,
  loginDismissed: false,
};

function subscribeMediaQuery(query: string, onChange: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => subscribeMediaQuery(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function clearSheetViewportStyles(sheet: HTMLElement) {
  sheet.style.paddingTop = "";
  sheet.style.paddingBottom = "";
  sheet.style.boxSizing = "";
}

function useIosKeyboardSheetLock(
  enabled: boolean,
  sheetRef: RefObject<HTMLDivElement | null>,
) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    const sheet = sheetRef.current;
    if (sheet) sheet.style.boxSizing = "border-box";

    let raf = 0;
    let lastTop = Number.NaN;
    let lastBottom = Number.NaN;
    let animatingUntil = 0;

    const sync = () => {
      const el = sheetRef.current;
      if (!el) return;
      const vv = window.visualViewport;
      const layoutH = window.innerHeight;
      const top = Math.max(0, Math.round(vv?.offsetTop ?? 0));
      const visible = Math.round(vv?.height ?? layoutH);
      const bottom = Math.max(0, layoutH - top - visible);
      if (top === lastTop && bottom === lastBottom) return;
      lastTop = top;
      lastBottom = bottom;
      el.style.paddingTop = top ? `${top}px` : "0px";
      el.style.paddingBottom = bottom ? `${bottom}px` : "0px";
    };

    const runKeyboardAnimationSync = () => {
      animatingUntil = performance.now() + 500;
      const tick = (now: number) => {
        sync();
        if (now < animatingUntil) raf = requestAnimationFrame(tick);
        else {
          raf = 0;
          sync();
        }
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    const preventFocusScroll = (target: HTMLElement) => {
      window.scrollTo(0, 0);
      try {
        target.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const el = sheetRef.current;
      const target = event.target;
      if (!el || !(target instanceof HTMLElement) || !el.contains(target)) {
        return;
      }
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        preventFocusScroll(target);
        runKeyboardAnimationSync();
      }
    };

    const onFocusOut = () => runKeyboardAnimationSync();
    const onWindowScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    sync();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      cancelAnimationFrame(raf);
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", onWindowScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      const el = sheetRef.current;
      if (el) clearSheetViewportStyles(el);
      window.scrollTo(0, scrollY);
    };
  }, [enabled, sheetRef]);
}

function loadSession(): StoredSession | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.threadId && parsed.guestToken) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(session: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function saveGuide(guide: StoredGuide) {
  const session = loadSession();
  if (!session) return;
  saveSession({ ...session, guide });
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const coarse = useMediaQuery("(hover: none), (pointer: coarse)");
  const narrow = useMediaQuery("(max-width: 767px)");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [festivalOpen, setFestivalOpen] = useState(false);
  const [thread, setThread] = useState<SupportChatThreadDto | null>(null);
  const [guide, setGuide] = useState<StoredGuide>(DEFAULT_GUIDE);
  const [whatsappUrl, setWhatsappUrl] = useState("https://wa.me/");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [starting, setStarting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startAttempted = useRef(false);
  const openAfterReady = useRef(false);

  const hideOnRoute =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/");
  const launcherHidden = hideOnRoute || festivalOpen;

  const isMobile = coarse || narrow;
  const mobileSheet = open && isMobile;
  useIosKeyboardSheetLock(mobileSheet, sheetRef);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(BUBBLE_DISMISS_KEY) === "1") {
      setBubbleVisible(false);
    }
    void getSupportChatBootstrap().then((boot) => {
      setWhatsappUrl(boot.whatsappUrl);
      setIsLoggedIn(boot.isLoggedIn);
    });

    const session = loadSession();
    if (!session) {
      setSessionReady(true);
      return;
    }
    if (session.guide) setGuide(session.guide);
    void getSupportChatThread(session).then((result) => {
      if (!result.success || !result.data) {
        clearSession();
        setGuide(DEFAULT_GUIDE);
      } else {
        setThread(result.data);
        if (result.data.status === "CLOSED") {
          clearSession();
          setThread(null);
          setGuide(DEFAULT_GUIDE);
        }
      }
      setSessionReady(true);
    });
  }, []);

  useEffect(() => {
    const onOpenChat = () => {
      setOpen(true);
      setBubbleVisible(false);
      if (!sessionReady) {
        openAfterReady.current = true;
        return;
      }
      if (!thread) ensureThread();
    };
    const onFestival = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setFestivalOpen(Boolean(detail?.open));
      if (detail?.open) setOpen(false);
    };
    window.addEventListener("vidyora:open-support-chat", onOpenChat);
    window.addEventListener("vidyora:festival-modal", onFestival);
    return () => {
      window.removeEventListener("vidyora:open-support-chat", onOpenChat);
      window.removeEventListener("vidyora:festival-modal", onFestival);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, thread]);

  useEffect(() => {
    if (hideOnRoute) setOpen(false);
  }, [hideOnRoute]);

  const updateGuide = (next: StoredGuide | ((prev: StoredGuide) => StoredGuide)) => {
    setGuide((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      saveGuide(value);
      return value;
    });
  };

  const ensureThread = (force = false) => {
    if (!sessionReady && !force) return;
    if (!force && (thread || starting || startAttempted.current)) return;
    if (force) startAttempted.current = false;
    if (startAttempted.current) return;
    startAttempted.current = true;
    setStarting(true);
    setError(null);
    startTransition(async () => {
      const result = await startSupportChat();
      setStarting(false);
      if (!result.success) {
        startAttempted.current = false;
        setError(result.error || "Could not start chat");
        return;
      }
      const freshGuide = { ...DEFAULT_GUIDE };
      saveSession({
        threadId: result.data.id,
        guestToken: result.data.guestToken,
        guide: freshGuide,
      });
      setGuide(freshGuide);
      setThread(result.data);
      setIsLoggedIn(!result.data.isGuest);
    });
  };

  useEffect(() => {
    if (!sessionReady) return;
    if (openAfterReady.current && !thread) {
      openAfterReady.current = false;
      ensureThread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, thread]);

  const openPanel = () => {
    setOpen(true);
    setBubbleVisible(false);
    if (!sessionReady) {
      openAfterReady.current = true;
      return;
    }
    if (!thread) ensureThread();
  };

  const dismissBubble = () => {
    setBubbleVisible(false);
    localStorage.setItem(BUBBLE_DISMISS_KEY, "1");
  };

  const startNewChat = () => {
    clearSession();
    setThread(null);
    setGuide(DEFAULT_GUIDE);
    setError(null);
    setOpen(true);
    ensureThread(true);
  };

  if (!mounted) return null;

  const panel = (
    <SupportChatPanel
      thread={thread}
      setThread={setThread}
      guide={guide}
      updateGuide={updateGuide}
      whatsappUrl={whatsappUrl}
      isLoggedIn={isLoggedIn}
      error={error}
      setError={setError}
      pending={pending || starting}
      startTransition={startTransition}
      onMinimize={() => setOpen(false)}
      onClose={() => setOpen(false)}
      onStartNew={startNewChat}
      onRetryStart={() => {
        startAttempted.current = false;
        ensureThread();
      }}
      mobileFullScreen={isMobile}
      starting={(starting || !sessionReady) && !thread}
    />
  );

  return createPortal(
    <>
      {isMobile ? (
        <>
          <div
            ref={sheetRef}
            className={cn(
              "pointer-events-auto fixed inset-x-0 top-0 z-[10040] box-border h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#faf8f6] print:hidden",
              open ? "flex" : "hidden",
            )}
            aria-hidden={!open}
          >
            {panel}
          </div>

          {!open && !launcherHidden ? (
            <div
              className={cn(
                "pointer-events-none fixed z-[10040] flex flex-col items-end print:hidden",
                "right-3 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))]",
              )}
            >
              <Launcher
                bubbleVisible={bubbleVisible}
                onOpen={openPanel}
                onDismiss={dismissBubble}
                compact
              />
            </div>
          ) : null}
        </>
      ) : (
        <div
          className={cn(
            "pointer-events-none fixed z-[10040] flex flex-col items-end print:hidden",
            "right-3 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))]",
            "sm:right-5 sm:bottom-5",
          )}
        >
          {open && !launcherHidden ? (
            <div className="pointer-events-auto mb-2">{panel}</div>
          ) : null}
          {!launcherHidden ? (
            <Launcher
              bubbleVisible={!open && bubbleVisible}
              onOpen={() => (open ? setOpen(false) : openPanel())}
              onDismiss={dismissBubble}
              open={open}
            />
          ) : null}
        </div>
      )}
    </>,
    document.body,
  );
}

function Launcher({
  bubbleVisible,
  onOpen,
  onDismiss,
  open = false,
  compact = false,
}: {
  bubbleVisible: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  open?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {bubbleVisible ? (
        <div className="pointer-events-auto flex max-w-[min(70vw,300px)] items-center gap-1.5 rounded-full bg-white py-1 pr-1 pl-1 shadow-[0_8px_28px_rgba(43,26,22,0.18)] ring-1 ring-black/5">
          <span
            className={cn(
              "relative shrink-0 overflow-hidden rounded-full bg-[#f6ead7]",
              compact ? "size-11" : "size-11 sm:size-12",
            )}
          >
            <Image
              src={CONCIERGE_AVATAR}
              alt=""
              fill
              className="object-cover object-[center_18%]"
              sizes="48px"
            />
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 flex-1 truncate py-2 pr-1 text-left text-[13px] leading-none whitespace-nowrap text-neutral-900 sm:text-sm"
          >
            How can I help you?
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            className="mr-0.5 shrink-0 rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
            onClick={onDismiss}
          >
            <X className="size-3.5" strokeWidth={2.25} />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-label={open ? "Minimize chat" : "Chat with VIDYORA"}
        onClick={onOpen}
        className={cn(
          "pointer-events-auto relative size-[4.2rem] shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#f6ead7] shadow-[0_12px_32px_rgba(43,26,22,0.28)] ring-1 ring-[#8b2e2e]/20 active:scale-[0.98]",
          !compact && "transition hover:scale-[1.03] sm:size-[4.8rem]",
        )}
      >
        <Image
          src={CONCIERGE_AVATAR}
          alt=""
          fill
          className="object-cover object-[center_18%]"
          sizes="77px"
          priority={compact}
        />
      </button>
    </div>
  );
}

function SupportChatPanel({
  thread,
  setThread,
  guide,
  updateGuide,
  whatsappUrl,
  isLoggedIn,
  error,
  setError,
  pending,
  startTransition,
  onMinimize,
  onClose,
  onStartNew,
  onRetryStart,
  mobileFullScreen = false,
  starting = false,
}: {
  thread: SupportChatThreadDto | null;
  setThread: Dispatch<SetStateAction<SupportChatThreadDto | null>>;
  guide: StoredGuide;
  updateGuide: (
    next: StoredGuide | ((prev: StoredGuide) => StoredGuide),
  ) => void;
  whatsappUrl: string;
  isLoggedIn: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onMinimize: () => void;
  onClose: () => void;
  onStartNew: () => void;
  onRetryStart: () => void;
  mobileFullScreen?: boolean;
  starting?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col overflow-hidden bg-white",
        mobileFullScreen
          ? "h-full w-full rounded-none border-0 shadow-none"
          : "h-[min(72vh,580px)] w-[min(100vw-1.5rem,360px)] rounded-2xl border border-[#ead9c4] shadow-[0_24px_60px_rgba(43,26,22,0.28)]",
      )}
    >
      <header
        className={cn(
          "flex shrink-0 items-start justify-between gap-2 bg-[#8b2e2e] px-4 py-3 text-white",
          mobileFullScreen && "pt-[max(0.75rem,env(safe-area-inset-top))]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative size-[3.3rem] shrink-0 overflow-hidden rounded-full border border-white/30 bg-[#f6ead7]">
            <Image
              src={CONCIERGE_AVATAR}
              alt=""
              fill
              priority={mobileFullScreen}
              className="object-cover object-[center_18%]"
              sizes="53px"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-lg leading-tight">VIDYORA</p>
            <p className="text-[11px] tracking-wide text-[#f7e7d8] uppercase">
              Jewellery Concierge
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {thread ? (
            <button
              type="button"
              aria-label="Start new chat"
              title="Start new chat"
              onClick={onStartNew}
              className="rounded-full p-1.5 hover:bg-white/10"
            >
              <RotateCcw className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Minimize"
            onClick={onMinimize}
            className="rounded-full p-1.5 hover:bg-white/10"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      {thread ? (
        <ChatRoom
          thread={thread}
          setThread={setThread}
          guide={guide}
          updateGuide={updateGuide}
          whatsappUrl={whatsappUrl}
          isLoggedIn={isLoggedIn}
          pending={pending}
          startTransition={startTransition}
          error={error}
          setError={setError}
          mobileFullScreen={mobileFullScreen}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#faf8f6] px-6 text-center">
          {starting || pending ? (
            <>
              <Loader2 className="size-6 animate-spin text-[#8b2e2e]" />
              <p className="text-sm text-neutral-600">Starting your chat…</p>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-600">
                {error || "Unable to start chat."}
              </p>
              <button
                type="button"
                className="rounded-full bg-[#8b2e2e] px-4 py-2 text-sm text-white"
                onClick={onRetryStart}
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ChatRoom({
  thread,
  setThread,
  guide,
  updateGuide,
  whatsappUrl,
  isLoggedIn,
  pending,
  startTransition,
  error,
  setError,
  mobileFullScreen = false,
}: {
  thread: SupportChatThreadDto;
  setThread: Dispatch<SetStateAction<SupportChatThreadDto | null>>;
  guide: StoredGuide;
  updateGuide: (
    next: StoredGuide | ((prev: StoredGuide) => StoredGuide),
  ) => void;
  whatsappUrl: string;
  isLoggedIn: boolean;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  error: string | null;
  setError: (e: string | null) => void;
  mobileFullScreen?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const shotRef = useRef<HTMLInputElement>(null);

  const isGuest = thread.isGuest && !isLoggedIn;
  const showLoginCta =
    isGuest &&
    !guide.loginDismissed &&
    guide.step === "recommend";

  useSupportChatRealtime({
    mode: "customer",
    threadId: thread.id,
    guestToken: thread.guestToken,
    onMessage: (message) => {
      setThread((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [thread.messages.length, guide.step, showLoginCta]);

  function appendMessages(messages: SupportChatMessageDto[]) {
    setThread((prev) => {
      if (!prev) return prev;
      const existing = new Set(prev.messages.map((m) => m.id));
      const next = messages.filter((m) => !existing.has(m.id));
      if (next.length === 0) return prev;
      return { ...prev, messages: [...prev.messages, ...next] };
    });
  }

  function replaceAllMessages(messages: SupportChatMessageDto[]) {
    setThread((prev) => (prev ? { ...prev, messages } : prev));
  }

  async function sendAsync(
    body: string,
    options?: {
      skipAutoReply?: boolean;
      agentFollowUp?: string;
      attachment?: { url: string; name: string; type: string };
    },
  ) {
    const result = await sendSupportChatMessage({
      threadId: thread.id,
      guestToken: thread.guestToken,
      body,
      attachmentUrl: options?.attachment?.url || "",
      attachmentName: options?.attachment?.name || "",
      attachmentType: options?.attachment?.type || "",
      skipAutoReply: options?.skipAutoReply,
      agentFollowUp: options?.agentFollowUp,
    });
    if (!result.success) {
      setError(result.error || "Failed to send");
      return false;
    }
    setDraft("");
    replaceAllMessages(result.data.messages);
    return true;
  }

  function pickCategory(id: GuideCategoryId) {
    const chip = GUIDE_CATEGORIES.find((c) => c.id === id);
    if (!chip) return;

    if (id === "type" || id === "other") {
      updateGuide({
        ...guide,
        step: "free",
        categoryId: id,
        occasionId: null,
        productOffset: 0,
      });
      setError(null);
      startTransition(async () => {
        await sendAsync(chip.label, {
          skipAutoReply: true,
          agentFollowUp:
            "Tell me what you’re looking for — style, metal, budget, or occasion — and I’ll help.",
        });
      });
      return;
    }

    updateGuide({
      ...guide,
      categoryId: id,
      occasionId: null,
      productOffset: 0,
      freeQuery: undefined,
      step: "occasion",
    });
    setError(null);
    startTransition(async () => {
      await sendAsync(chip.label, {
        skipAutoReply: true,
        agentFollowUp:
          "Perfect! Tell me a little more about what you're looking for:",
      });
    });
  }

  function pickOccasion(id: GuideOccasionId) {
    const chip = GUIDE_OCCASIONS.find((c) => c.id === id);
    if (!chip) return;
    const categoryId = guide.categoryId;
    setError(null);
    startTransition(async () => {
      const ok = await sendAsync(chip.label, { skipAutoReply: true });
      if (!ok) return;
      const result = await recommendSupportChatProducts({
        threadId: thread.id,
        guestToken: thread.guestToken,
        categoryId,
        occasionId: id,
        offset: 0,
        query: guide.freeQuery || "",
      });
      if (!result.success) {
        setError(result.error || "Could not load recommendations");
        return;
      }
      appendMessages(result.data.messages);
      updateGuide({
        step: "recommend",
        categoryId,
        occasionId: id,
        productOffset: 0,
        loginDismissed: guide.loginDismissed,
        freeQuery: guide.freeQuery,
      });
    });
  }

  function onRecommendAction(
    id: (typeof GUIDE_RECOMMEND_ACTIONS)[number]["id"],
  ) {
    if (id === "more") {
      const next = guide.productOffset + 3;
      setError(null);
      startTransition(async () => {
        const result = await recommendSupportChatProducts({
          threadId: thread.id,
          guestToken: thread.guestToken,
          categoryId: guide.categoryId,
          occasionId: guide.occasionId,
          offset: next,
          query: guide.freeQuery || "",
        });
        if (!result.success) {
          setError(result.error || "Could not load recommendations");
          return;
        }
        appendMessages(result.data.messages);
        updateGuide({
          ...guide,
          step: "recommend",
          productOffset: next,
        });
      });
      return;
    }
    if (id === "change") {
      setError(null);
      startTransition(async () => {
        await sendAsync("Change Preference", {
          skipAutoReply: true,
          agentFollowUp:
            "No problem — let's start again. How can I help you today?",
        });
        updateGuide({ ...DEFAULT_GUIDE, loginDismissed: guide.loginDismissed });
      });
      return;
    }
    updateGuide({ ...guide, step: "free" });
  }

  function onComposeSend(text: string) {
    if (guide.step === "category") {
      setError(null);
      startTransition(async () => {
        await sendAsync(text, {
          skipAutoReply: true,
          agentFollowUp:
            "Got it! Tell me a little more — Everyday, Party, Wedding/Festive, Gift, or Budget?",
        });
        updateGuide({
          ...guide,
          step: "occasion",
          categoryId: "type",
          freeQuery: text,
          productOffset: 0,
        });
      });
      return;
    }

    if (guide.step === "occasion") {
      setError(null);
      startTransition(async () => {
        await sendAsync(text, { skipAutoReply: true });
        const result = await recommendSupportChatProducts({
          threadId: thread.id,
          guestToken: thread.guestToken,
          categoryId: guide.categoryId,
          occasionId: guide.occasionId,
          offset: 0,
          query: text,
        });
        if (!result.success) {
          setError(result.error || "Could not load recommendations");
          return;
        }
        appendMessages(result.data.messages);
        updateGuide({
          step: "recommend",
          categoryId: guide.categoryId,
          occasionId: guide.occasionId,
          productOffset: 0,
          loginDismissed: guide.loginDismissed,
          freeQuery: text,
        });
      });
      return;
    }

    if (guide.step === "free") {
      setError(null);
      startTransition(async () => {
        await sendAsync(text, { skipAutoReply: true });
        const result = await recommendSupportChatProducts({
          threadId: thread.id,
          guestToken: thread.guestToken,
          categoryId: guide.categoryId,
          occasionId: null,
          offset: 0,
          query: text,
        });
        if (!result.success) {
          setError(result.error || "Could not load recommendations");
          return;
        }
        appendMessages(result.data.messages);
        updateGuide({
          step: "recommend",
          categoryId: guide.categoryId,
          occasionId: null,
          productOffset: 0,
          loginDismissed: guide.loginDismissed,
          freeQuery: text,
        });
      });
      return;
    }

    setError(null);
    startTransition(async () => {
      await sendAsync(text);
    });
  }

  async function uploadAndSend(file: File, caption = "") {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("threadId", thread.id);
      formData.append("guestToken", thread.guestToken);
      const uploaded = await uploadSupportChatFile(formData);
      if (!uploaded.success) {
        setError(uploaded.error || "Upload failed");
        return;
      }
      void sendAsync(caption, {
        attachment: {
          url: uploaded.data.url,
          name: uploaded.data.name,
          type: uploaded.data.type,
        },
      });
    } finally {
      setUploading(false);
    }
  }

  async function captureScreenshot() {
    setError(null);
    const isTouchOrIOS =
      typeof window !== "undefined" &&
      (/iP(hone|ad|od)/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
        window.matchMedia("(hover: none), (pointer: coarse)").matches);

    if (isTouchOrIOS) {
      shotRef.current?.click();
      return;
    }

    try {
      if (navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const track = stream.getVideoTracks()[0];
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();
        await new Promise((r) => window.setTimeout(r, 120));
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        track.stop();
        stream.getTracks().forEach((t) => t.stop());
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (!blob) {
          setError("Could not capture screenshot");
          return;
        }
        const file = new File([blob], `screenshot-${Date.now()}.png`, {
          type: "image/png",
        });
        await uploadAndSend(file, "Here's a screenshot");
        return;
      }
    } catch {
      /* fall through */
    }
    shotRef.current?.click();
  }

  const busy = pending || uploading;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#faf8f6]">
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {thread.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {busy && guide.step !== "free" ? (
          <div className="flex items-center gap-2 px-1 text-[12px] text-neutral-500">
            <Loader2 className="size-3.5 animate-spin text-[#8b2e2e]" />
            Finding pieces for you…
          </div>
        ) : null}

        {guide.step === "category" ? (
          <GuideChips
            disabled={busy}
            chips={GUIDE_CATEGORIES.map((c) => ({
              id: c.id,
              label: c.label,
            }))}
            onPick={(id) => pickCategory(id as GuideCategoryId)}
          />
        ) : null}

        {guide.step === "occasion" ? (
          <GuideChips
            disabled={busy}
            chips={GUIDE_OCCASIONS.map((c) => ({
              id: c.id,
              label: c.label,
            }))}
            onPick={(id) => pickOccasion(id as GuideOccasionId)}
          />
        ) : null}

        {guide.step === "recommend" ? (
          <GuideChips
            disabled={busy}
            chips={GUIDE_RECOMMEND_ACTIONS.map((c) => ({
              id: c.id,
              label: c.label,
            }))}
            onPick={(id) =>
              onRecommendAction(
                id as (typeof GUIDE_RECOMMEND_ACTIONS)[number]["id"],
              )
            }
          />
        ) : null}

        {showLoginCta ? (
          <div className="rounded-2xl border border-[#ead9c4] bg-white px-3.5 py-3 shadow-sm">
            <p className="text-sm leading-relaxed text-neutral-800">
              Want to save your favourites and get personalised recommendations?
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/register?callbackUrl=/"
                className="flex h-10 items-center justify-center rounded-full bg-[#8b2e2e] text-sm font-medium text-white"
              >
                Create Free Account
              </Link>
              <Link
                href="/login?callbackUrl=/"
                className="flex h-10 items-center justify-center rounded-full border border-[#ead9c4] bg-[#fffdf9] text-sm text-[#8b2e2e]"
              >
                Sign in
              </Link>
              <button
                type="button"
                onClick={() =>
                  updateGuide({ ...guide, loginDismissed: true })
                }
                className="text-[12px] text-neutral-500 underline-offset-2 hover:underline"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="px-3 pb-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "shrink-0 border-t border-[#efe8e2] bg-white p-2.5",
          mobileFullScreen && "pb-2.5",
        )}
      >
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
            title="Send a file"
          >
            <Paperclip className="size-3.5" />
            Send a file
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void captureScreenshot()}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
            title="Add a photo or screenshot"
          >
            <Camera className="size-3.5" />
            Add screenshot
          </button>
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-[11px] text-[#8b2e2e] hover:underline"
          >
            WhatsApp
          </Link>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            onComposeSend(draft.trim());
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            enterKeyHint="send"
            placeholder={
              guide.step === "category" || guide.step === "occasion"
                ? "Or type your preference…"
                : guide.step === "free"
                  ? "Describe what you’re looking for…"
                  : "Type a message…"
            }
            style={{ fontSize: 16 }}
            className="max-h-24 min-h-10 flex-1 resize-none rounded-2xl border border-neutral-200 bg-[#faf8f6] px-3 py-2.5 text-base leading-normal outline-none focus:border-[#8b2e2e]"
            onTouchStart={(event) => {
              const el = event.currentTarget;
              if (document.activeElement !== el) {
                event.preventDefault();
                el.focus({ preventScroll: true });
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (draft.trim()) onComposeSend(draft.trim());
              }
            }}
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label="Send"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#8b2e2e] text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadAndSend(file);
          }}
        />
        <input
          ref={shotRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadAndSend(file, "Here's a screenshot");
          }}
        />
        <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-neutral-400">
          <FileUp className="size-3" />
          Images & PDF up to 5MB
        </p>
      </div>
    </div>
  );
}

function GuideChips({
  chips,
  onPick,
  disabled,
}: {
  chips: Array<{ id: string; label: string }>;
  onPick: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(chip.id)}
          className="rounded-full border border-[#ead9c4] bg-white px-3 py-1.5 text-[12px] text-[#8b2e2e] transition active:scale-[0.98] disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function ProductCards({ products }: { products: SupportChatProductCard[] }) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2">
      {products.map((product) => (
        <Link
          key={product.id}
          href={product.href}
          className="flex gap-2.5 overflow-hidden rounded-xl border border-[#efe8e2] bg-[#fffdf9] p-2 transition hover:border-[#ead9c4]"
        >
          <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#f6ead7]">
            {product.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.thumbnail}
                alt=""
                className="size-full object-cover"
              />
            ) : null}
          </span>
          <span className="min-w-0 flex-1 py-0.5">
            <span className="line-clamp-2 text-[12px] leading-snug font-medium text-neutral-900">
              {product.name}
            </span>
            <span className="mt-1 block text-[12px] text-[#8b2e2e]">
              {formatCurrency(product.price)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: SupportChatMessageDto }) {
  const mine = message.sender === "CUSTOMER";
  const system = message.sender === "SYSTEM";
  const isImage = Boolean(
    message.attachmentType?.startsWith("image/") && message.attachmentUrl,
  );
  const products = message.products;

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
          mine
            ? "rounded-br-md bg-[#8b2e2e] text-white"
            : system
              ? "rounded-bl-md border border-dashed border-[#ead9c4] bg-[#fffdf9] text-neutral-600"
              : "rounded-bl-md bg-white text-neutral-800",
          products?.length ? "max-w-[92%]" : "",
        )}
      >
        {message.body ? (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        ) : null}
        {products?.length ? <ProductCards products={products} /> : null}
        {message.attachmentUrl ? (
          <div className={cn(message.body ? "mt-2" : "")}>
            {isImage ? (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.attachmentUrl}
                  alt={message.attachmentName || "Attachment"}
                  className="max-h-40 w-full object-cover"
                />
              </a>
            ) : (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 underline",
                  mine ? "text-[#f7e7d8]" : "text-[#8b2e2e]",
                )}
              >
                <Paperclip className="size-3.5" />
                {message.attachmentName || "Attachment"}
              </a>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

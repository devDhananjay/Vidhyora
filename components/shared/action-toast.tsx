"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TOAST_EVENT = "vidyora:action-toast";

type ActionToastPayload = {
  message: string;
  href: string;
  linkLabel: string;
  durationMs?: number;
};

type ToastState = ActionToastPayload & { id: number };

/** Fire-and-forget toast — works across client bundles via window event. */
export function showActionToast(payload: ActionToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ActionToastPayload>(TOAST_EVENT, { detail: payload }),
  );
}

export function ActionToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setToast(null), 280);
  }, []);

  const show = useCallback((payload: ActionToastPayload) => {
    const next: ToastState = { ...payload, id: Date.now() };
    setToast(next);
    setVisible(false);
    // Next frame so enter animation always runs
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setVisible(true));
    });
    const ms = payload.durationMs ?? 5000;
    window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => {
        setToast((current) => (current?.id === next.id ? null : current));
      }, 280);
    }, ms);
  }, []);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ActionToastPayload>).detail;
      if (!detail?.message || !detail.href) return;
      show(detail);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [show]);

  const portal =
    mounted && toast
      ? createPortal(
          <div
            className={cn(
              "pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out",
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0",
            )}
            role="status"
            aria-live="polite"
          >
            <div
              className={cn(
                "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-[0_16px_48px_rgba(43,26,22,0.22)] transition-transform duration-300 ease-out",
                visible ? "scale-100" : "scale-95",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2f5d50]/12 text-[#2f5d50]">
                <Check className="size-4" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">
                  {toast.message}
                </p>
                <Link
                  href={toast.href}
                  onClick={hide}
                  className="mt-0.5 inline-block text-xs font-semibold text-[#8b2e2e] underline-offset-2 hover:underline"
                >
                  {toast.linkLabel}
                </Link>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={hide}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {children}
      {portal}
    </>
  );
}

export function useActionToast() {
  return { show: showActionToast };
}

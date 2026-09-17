"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  HelpCircle,
  Info,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppDialogVariant = "info" | "success" | "error" | "confirm";

type AppDialogRequest = {
  mode: "alert" | "confirm";
  title?: string;
  message: string;
  variant?: AppDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
};

type AppDialogApi = {
  alert: (
    message: string,
    options?: {
      title?: string;
      variant?: Exclude<AppDialogVariant, "confirm">;
      confirmLabel?: string;
    },
  ) => Promise<void>;
  confirm: (
    message: string,
    options?: {
      title?: string;
      confirmLabel?: string;
      cancelLabel?: string;
    },
  ) => Promise<boolean>;
};

const AppDialogContext = createContext<AppDialogApi | null>(null);

let imperativeApi: AppDialogApi | null = null;

export function appAlert(
  message: string,
  options?: {
    title?: string;
    variant?: Exclude<AppDialogVariant, "confirm">;
    confirmLabel?: string;
  },
): Promise<void> {
  if (!imperativeApi) {
    // Fallback before provider mounts (SSR / edge cases)
    if (typeof window !== "undefined") window.alert(message);
    return Promise.resolve();
  }
  return imperativeApi.alert(message, options);
}

export function appConfirm(
  message: string,
  options?: {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  },
): Promise<boolean> {
  if (!imperativeApi) {
    if (typeof window !== "undefined") return Promise.resolve(window.confirm(message));
    return Promise.resolve(false);
  }
  return imperativeApi.confirm(message, options);
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return ctx;
}

function variantMeta(variant: AppDialogVariant) {
  switch (variant) {
    case "success":
      return {
        Icon: CheckCircle2,
        ring: "bg-[#f3ebe4] text-[#8b2e2e]",
        title: "Success",
      };
    case "error":
      return {
        Icon: XCircle,
        ring: "bg-[#f8eaea] text-[#8b2e2e]",
        title: "Something went wrong",
      };
    case "confirm":
      return {
        Icon: HelpCircle,
        ring: "bg-[#f3ebe4] text-[#8b2e2e]",
        title: "Please confirm",
      };
    default:
      return {
        Icon: Info,
        ring: "bg-[#f3ebe4] text-[#8b2e2e]",
        title: "Notice",
      };
  }
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<AppDialogRequest[]>([]);
  const current = queue[0] ?? null;
  const open = Boolean(current);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    resolveRef.current = current?.resolve ?? null;
  }, [current]);

  const enqueue = useCallback((request: Omit<AppDialogRequest, "resolve">) => {
    return new Promise<boolean>((resolve) => {
      setQueue((prev) => [...prev, { ...request, resolve }]);
    });
  }, []);

  const closeWith = useCallback((value: boolean) => {
    setQueue((prev) => {
      const [first, ...rest] = prev;
      if (first) first.resolve(value);
      return rest;
    });
  }, []);

  const api = useMemo<AppDialogApi>(
    () => ({
      alert: async (message, options) => {
        await enqueue({
          mode: "alert",
          message,
          title: options?.title,
          variant: options?.variant || "info",
          confirmLabel: options?.confirmLabel || "OK",
        });
      },
      confirm: async (message, options) =>
        enqueue({
          mode: "confirm",
          message,
          title: options?.title,
          variant: "confirm",
          confirmLabel: options?.confirmLabel || "Confirm",
          cancelLabel: options?.cancelLabel || "Cancel",
        }),
    }),
    [enqueue],
  );

  useEffect(() => {
    imperativeApi = api;
    return () => {
      if (imperativeApi === api) imperativeApi = null;
    };
  }, [api]);

  const variant = current?.variant || (current?.mode === "confirm" ? "confirm" : "info");
  const meta = variantMeta(variant);
  const Icon = meta.Icon;

  return (
    <AppDialogContext.Provider value={api}>
      {children}
      {open && current ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Dismiss dialog backdrop"
            className="absolute inset-0 bg-[#2b1a16]/45 backdrop-blur-[2px]"
            onClick={() => {
              if (current.mode === "confirm") closeWith(false);
              else closeWith(true);
            }}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-desc"
            className="relative z-[1] w-full max-w-md overflow-hidden rounded-[28px] border border-[#ead9c4]/80 bg-[#fffcf8] shadow-[0_24px_60px_rgba(43,26,22,0.22)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_30%_0%,rgba(139,46,46,0.12),transparent_60%)]" />
            <div className="relative px-6 pb-6 pt-7 sm:px-8">
              <div className="mb-5 flex justify-center">
                <span
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full border border-[#ead9c4]/90 shadow-sm",
                    meta.ring,
                  )}
                >
                  <Icon className="size-7" strokeWidth={1.6} />
                </span>
              </div>
              <h2
                id="app-dialog-title"
                className="text-center font-serif text-2xl font-normal tracking-tight text-[#2b1a16]"
              >
                {current.title || meta.title}
              </h2>
              <p
                id="app-dialog-desc"
                className="mt-3 text-center text-sm leading-relaxed text-neutral-600"
              >
                {current.message}
              </p>

              <div
                className={cn(
                  "mt-7 flex gap-2",
                  current.mode === "confirm"
                    ? "flex-col-reverse sm:flex-row sm:justify-end"
                    : "justify-center",
                )}
              >
                {current.mode === "confirm" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-[#ead9c4] bg-white px-5"
                      onClick={() => closeWith(false)}
                    >
                      {current.cancelLabel || "Cancel"}
                    </Button>
                    <Button
                      type="button"
                      className="rounded-full bg-[#8b2e2e] px-5 text-white hover:bg-[#7a2828]"
                      onClick={() => closeWith(true)}
                    >
                      {current.confirmLabel || "Confirm"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    className="min-w-[8.5rem] rounded-full bg-[#8b2e2e] px-6 text-white hover:bg-[#7a2828]"
                    onClick={() => closeWith(true)}
                    autoFocus
                  >
                    {current.confirmLabel || "OK"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppDialogContext.Provider>
  );
}

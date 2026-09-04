"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bell, BellRing, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vidyora-price-alerts";

type AlertRecord = {
  productId: string;
  name: string;
  mobile: string;
};

function readAlerts(): AlertRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): AlertRecord | null => {
        if (typeof item === "string") {
          return { productId: item, name: "", mobile: "" };
        }
        if (
          item &&
          typeof item === "object" &&
          typeof (item as AlertRecord).productId === "string"
        ) {
          const record = item as AlertRecord;
          return {
            productId: record.productId,
            name: typeof record.name === "string" ? record.name : "",
            mobile: typeof record.mobile === "string" ? record.mobile : "",
          };
        }
        return null;
      })
      .filter((item): item is AlertRecord => Boolean(item));
  } catch {
    return [];
  }
}

function writeAlerts(items: AlertRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type PriceDropNotifyProps = {
  productId: string;
  productName: string;
  compact?: boolean;
};

export function PriceDropNotify({
  productId,
  productName,
  compact = false,
}: PriceDropNotifyProps) {
  const [open, setOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    const alerts = readAlerts();
    const existing = alerts.find((item) => item.productId === productId);
    setSubscribed(Boolean(existing));
    if (existing) {
      setName(existing.name || "");
      setMobile(existing.mobile || "");
    }
    setReady(true);
  }, [productId]);

  function unsubscribe() {
    writeAlerts(readAlerts().filter((item) => item.productId !== productId));
    setSubscribed(false);
    setJustJoined(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedMobile = mobile.replace(/\D/g, "");

    if (trimmedName.length < 2) {
      setError("Please enter your full name");
      return;
    }
    if (trimmedMobile.length < 10) {
      setError("Please enter a valid mobile number");
      return;
    }

    setError("");
    const next = readAlerts().filter((item) => item.productId !== productId);
    next.push({
      productId,
      name: trimmedName,
      mobile: trimmedMobile,
    });
    writeAlerts(next);
    setSubscribed(true);
    setJustJoined(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setError("");
      setJustJoined(false);
    }
  }

  const body = (
    <div className="relative overflow-hidden">
      <div className="relative z-10 flex max-w-[85%] flex-col gap-2.5 pr-2">
        <h3
          className={cn(
            "font-serif text-[#8b2e2e]",
            compact ? "text-lg md:text-xl" : "text-2xl md:text-[28px]",
          )}
        >
          Waiting For A Better Price?
        </h3>

        {subscribed ? (
          <>
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-[#2f6b4f]"
                strokeWidth={1.8}
              />
              <div>
                <p className="font-serif text-base text-[#2f6b4f]">
                  You&apos;re all set
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 md:text-[13px]">
                  We&apos;ll notify you on WhatsApp/SMS when the price of this
                  product drops.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={unsubscribe}
              disabled={!ready}
              className="inline-flex h-8 w-fit items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-600 transition hover:border-[#8b2e2e]/30 hover:text-[#8b2e2e]"
            >
              Turn off alerts
            </button>
          </>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-neutral-500 md:text-[13px]">
              Get notified when the price of this product drops!
            </p>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  disabled={!ready}
                  className={cn(
                    "inline-flex h-8 w-fit items-center justify-center rounded-full bg-[#8b2e2e] px-4 text-xs font-medium text-white transition hover:bg-[#7a2727]",
                    !ready && "opacity-60",
                  )}
                >
                  Notify Me
                </button>
              </DialogTrigger>

              <DialogContent className="gap-0 overflow-hidden rounded-[28px] border-neutral-200 p-0 sm:max-w-[400px]">
                <div className="px-7 pb-7 pt-8">
                  {justJoined ? (
                    <div className="flex flex-col items-center text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-[#e8f5ef]">
                        <CheckCircle2
                          className="size-7 text-[#2f6b4f]"
                          strokeWidth={1.6}
                        />
                      </div>
                      <h3 className="mt-4 font-serif text-2xl text-neutral-900">
                        You&apos;re all set
                      </h3>
                      <p className="mt-2 text-sm text-neutral-500">
                        Thanks
                        {name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}!
                        We&apos;ll alert you when the price of {productName}{" "}
                        drops.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#8b2e2e] text-sm font-medium text-white transition hover:bg-[#7a2727]"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <DialogHeader className="items-center space-y-3 text-center sm:text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-[#f3e4e4]">
                          <Bell
                            className="size-5 text-[#8b2e2e]"
                            strokeWidth={1.6}
                          />
                        </div>
                        <DialogTitle className="font-serif text-2xl text-neutral-900">
                          Price Drop Alerts
                        </DialogTitle>
                        <DialogDescription className="text-sm text-neutral-500">
                          Be the first to know when the price of {productName}{" "}
                          drops.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                        <input
                          type="text"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Full Name"
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-[#8b2e2e]"
                          autoComplete="name"
                        />
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={mobile}
                          onChange={(event) =>
                            setMobile(
                              event.target.value.replace(/\D/g, "").slice(0, 10),
                            )
                          }
                          placeholder="Mobile Number"
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-[#8b2e2e]"
                          autoComplete="tel"
                        />
                        {error ? (
                          <p className="text-sm text-red-600">{error}</p>
                        ) : null}
                        <button
                          type="submit"
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#8b2e2e] text-sm font-medium text-white transition hover:bg-[#7a2727]"
                        >
                          Notify Me
                          <ArrowRight className="size-4" strokeWidth={1.8} />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <div
        className="pointer-events-none absolute -right-2 top-1/2 hidden size-24 -translate-y-1/2 sm:block md:right-1 md:size-28"
        aria-hidden
      >
        <span className="absolute inset-0 rounded-full border border-[#8b2e2e]/12" />
        <span className="absolute inset-3 rounded-full border border-[#8b2e2e]/15" />
        <span className="absolute inset-5 rounded-full border-2 border-transparent border-t-[#c17a7a]/60 border-r-[#c17a7a]/35" />
        <span className="absolute inset-0 flex items-center justify-center text-[#8b2e2e]">
          {subscribed ? (
            <BellRing className="size-6" strokeWidth={1.4} />
          ) : (
            <Bell className="size-6" strokeWidth={1.4} />
          )}
        </span>
      </div>
    </div>
  );

  if (compact) return body;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
      {body}
    </section>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
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
import {
  subscribeProductAlert,
  unsubscribeProductAlert,
} from "@/actions/products/product-alerts";

const STORAGE_KEY = "vidyora-product-alerts";

type AlertRecord = {
  productId: string;
  type: "PRICE_DROP" | "BACK_IN_STOCK";
  name: string;
  mobile: string;
};

function readLocal(): AlertRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const legacy = window.localStorage.getItem("vidyora-price-alerts");
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const fromNew = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is AlertRecord =>
            Boolean(
              item &&
                typeof item === "object" &&
                typeof (item as AlertRecord).productId === "string" &&
                ((item as AlertRecord).type === "PRICE_DROP" ||
                  (item as AlertRecord).type === "BACK_IN_STOCK"),
            ),
        )
      : [];
    if (fromNew.length) return fromNew;
    // migrate legacy price-drop keys
    const legacyParsed = legacy ? (JSON.parse(legacy) as unknown) : [];
    if (!Array.isArray(legacyParsed)) return [];
    return legacyParsed
      .map((item): AlertRecord | null => {
        if (
          item &&
          typeof item === "object" &&
          typeof (item as { productId?: string }).productId === "string"
        ) {
          const record = item as {
            productId: string;
            name?: string;
            mobile?: string;
          };
          return {
            productId: record.productId,
            type: "PRICE_DROP",
            name: record.name || "",
            mobile: record.mobile || "",
          };
        }
        return null;
      })
      .filter((item): item is AlertRecord => Boolean(item));
  } catch {
    return [];
  }
}

function writeLocal(items: AlertRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

type ProductAlertNotifyProps = {
  productId: string;
  productName: string;
  type: "PRICE_DROP" | "BACK_IN_STOCK";
  baselinePrice?: number;
  variantId?: string;
  compact?: boolean;
  /** PLP / card CTA — trigger button only + dialog */
  asButton?: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
};

export function ProductAlertNotify({
  productId,
  productName,
  type,
  baselinePrice,
  variantId,
  compact = false,
  asButton = false,
  triggerClassName,
  triggerLabel,
}: ProductAlertNotifyProps) {
  const [open, setOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [justJoined, setJustJoined] = useState(false);
  const [pending, startTransition] = useTransition();

  const isRestock = type === "BACK_IN_STOCK";
  const headline = isRestock
    ? "Sold out right now?"
    : "Waiting For A Better Price?";
  const cta = triggerLabel || (isRestock ? "Notify when back" : "Notify Me");
  const dialogTitle = isRestock ? "Back in stock alert" : "Price drop alerts";

  useEffect(() => {
    const alerts = readLocal();
    const existing = alerts.find(
      (item) => item.productId === productId && item.type === type,
    );
    setSubscribed(Boolean(existing));
    if (existing) {
      setName(existing.name || "");
      setMobile(existing.mobile || "");
    }
    setReady(true);
  }, [productId, type]);

  function unsubscribe() {
    startTransition(async () => {
      await unsubscribeProductAlert({
        productId,
        type,
        phone: mobile || undefined,
      });
      writeLocal(
        readLocal().filter(
          (item) => !(item.productId === productId && item.type === type),
        ),
      );
      setSubscribed(false);
      setJustJoined(false);
    });
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
    startTransition(async () => {
      const result = await subscribeProductAlert({
        productId,
        type,
        name: trimmedName,
        phone: trimmedMobile,
        variantId,
        baselinePrice,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      const next = readLocal().filter(
        (item) => !(item.productId === productId && item.type === type),
      );
      next.push({
        productId,
        type,
        name: trimmedName,
        mobile: trimmedMobile,
      });
      writeLocal(next);
      setSubscribed(true);
      setJustJoined(true);
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setError("");
      setJustJoined(false);
    }
  }

  const dialog = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={!ready}
          onClick={(event) => {
            event.stopPropagation();
          }}
          className={cn(
            "inline-flex h-8 w-fit items-center justify-center gap-1 rounded-full bg-[#8b2e2e] px-4 text-xs font-medium text-white transition hover:bg-[#7a2727]",
            !ready && "opacity-60",
            triggerClassName,
          )}
        >
          {subscribed ? (
            <>
              <BellRing className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span className="truncate">Alert on</span>
            </>
          ) : (
            <>
              <Bell className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{cta}</span>
            </>
          )}
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
                {name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}! Your
                alert for {productName} is saved.
              </p>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#8b2e2e] text-sm font-medium text-white transition hover:bg-[#7a2727]"
              >
                Done
              </button>
            </div>
          ) : subscribed && asButton ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#e8f5ef]">
                <CheckCircle2
                  className="size-7 text-[#2f6b4f]"
                  strokeWidth={1.6}
                />
              </div>
              <h3 className="mt-4 font-serif text-2xl text-neutral-900">
                Alert is on
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                We&apos;ll notify you when {productName} is back in stock.
              </p>
              <button
                type="button"
                onClick={unsubscribe}
                disabled={pending}
                className="mt-4 text-xs text-neutral-500 underline-offset-2 hover:underline"
              >
                Turn off alerts
              </button>
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
                  {dialogTitle}
                </DialogTitle>
                <DialogDescription className="text-sm text-neutral-500">
                  Save an alert for {productName}. We&apos;ll use email when
                  linked to your account, and keep your mobile for SMS later.
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
                  disabled={pending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#8b2e2e] text-sm font-medium text-white transition hover:bg-[#7a2727] disabled:opacity-60"
                >
                  {cta}
                  <ArrowRight className="size-4" strokeWidth={1.8} />
                </button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (asButton) {
    return dialog;
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
          {headline}
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
                  {isRestock
                    ? "We'll email you when this piece is back in stock."
                    : "We'll alert you when the price drops."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={unsubscribe}
              disabled={!ready || pending}
              className="inline-flex h-8 w-fit items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-600 transition hover:border-[#8b2e2e]/30 hover:text-[#8b2e2e]"
            >
              Turn off alerts
            </button>
          </>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-neutral-500 md:text-[13px]">
              {isRestock
                ? "Leave your number — we'll notify you as soon as it returns."
                : "Get notified when the price of this product drops!"}
            </p>
            {dialog}
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

/** @deprecated Prefer ProductAlertNotify — kept for existing imports */
export function PriceDropNotify(
  props: Omit<ProductAlertNotifyProps, "type">,
) {
  return <ProductAlertNotify {...props} type="PRICE_DROP" />;
}

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, Shield, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vidyora-delivery-pincode";

/** Metro / tier-1 first-3 digit prefixes → faster SLA */
const FAST_PREFIXES = new Set([
  "110", // Delhi
  "122", // Gurgaon
  "201", // Noida
  "400", // Mumbai
  "411", // Pune
  "380", // Ahmedabad
  "560", // Bengaluru
  "600", // Chennai
  "500", // Hyderabad
  "700", // Kolkata
  "302", // Jaipur
  "226", // Lucknow
  "452", // Indore
  "641", // Coimbatore
  "682", // Kochi
]);

type DeliveryEstimate = {
  pincode: string;
  minDays: number;
  maxDays: number;
  etaLabel: string;
  dateRange: string;
  isFast: boolean;
  codAvailable: boolean;
};

function addBusinessDays(from: Date, days: number) {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function estimateForPincode(pincode: string): DeliveryEstimate {
  const prefix = pincode.slice(0, 3);
  const isFast = FAST_PREFIXES.has(prefix);
  const minDays = isFast ? 3 : 5;
  const maxDays = isFast ? 5 : 8;
  const now = new Date();
  const start = addBusinessDays(now, minDays);
  const end = addBusinessDays(now, maxDays);

  return {
    pincode,
    minDays,
    maxDays,
    isFast,
    codAvailable: true,
    etaLabel: isFast
      ? `${minDays}–${maxDays} working days`
      : `${minDays}–${maxDays} working days`,
    dateRange:
      formatDay(start) === formatDay(end)
        ? formatDay(start)
        : `${formatDay(start)} – ${formatDay(end)}`,
  };
}

export function DeliveryPincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && /^\d{6}$/.test(saved)) {
        setPincode(saved);
        setEstimate(estimateForPincode(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  function check(next?: string) {
    const value = (next ?? pincode).trim();
    if (!/^\d{6}$/.test(value)) {
      setError("Enter a valid 6-digit pincode");
      setEstimate(null);
      return;
    }

    setError("");
    const result = estimateForPincode(value);
    setEstimate(result);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 size-5 shrink-0 text-[#8b2e2e]" strokeWidth={1.6} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-neutral-900">Check delivery date</p>
          <p className="mt-0.5 text-sm text-neutral-500">
            Enter your pincode to see estimated delivery time
          </p>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              check();
            }}
          >
            <div className="relative min-w-0 flex-1">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                strokeWidth={1.6}
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={pincode}
                onChange={(event) => {
                  const next = event.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincode(next);
                  if (error) setError("");
                }}
                placeholder="Enter pincode"
                aria-label="Delivery pincode"
                className={cn(
                  "h-10 w-full rounded-full border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#8b2e2e]",
                  error ? "border-red-300" : "border-neutral-200",
                )}
              />
            </div>
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full bg-[#8b2e2e] px-5 text-sm font-medium text-white transition hover:bg-[#7a2727]"
            >
              Check
            </button>
          </form>

          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          {estimate ? (
            <div className="mt-4 space-y-2 rounded-xl bg-[#8b2e2e]/5 px-3.5 py-3">
              <div className="flex items-start gap-2 text-sm text-neutral-800">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-[#8b2e2e]"
                  strokeWidth={1.8}
                />
                <div>
                  <p className="font-medium text-[#8b2e2e]">
                    Delivery by {estimate.dateRange}
                  </p>
                  <p className="mt-0.5 text-neutral-600">
                    Usually arrives in {estimate.etaLabel} for {estimate.pincode}
                    {estimate.isFast ? " (express corridor)" : ""}.
                  </p>
                </div>
              </div>
              <p className="pl-6 text-sm text-neutral-600">
                Free delivery on orders above ₹500 · COD{" "}
                {estimate.codAvailable ? "available" : "not available"}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
        <Shield className="size-5 shrink-0 text-[#8b2e2e]" strokeWidth={1.6} />
        <div>
          <p className="font-medium text-neutral-900">Secure Transaction</p>
          <p className="text-sm text-neutral-500">100% payment protection</p>
        </div>
      </div>
    </div>
  );
}

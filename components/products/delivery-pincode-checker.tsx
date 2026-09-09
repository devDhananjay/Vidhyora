"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, MapPin, Shield, Truck } from "lucide-react";
import { checkDeliveryEstimate } from "@/actions/maps/google-places";
import { cn } from "@/lib/utils";

type DeliveryEstimate = {
  pincode: string;
  city: string;
  state: string;
  distanceText: string | null;
  durationText: string | null;
  etaLabel: string;
  dateRange: string;
  isFast: boolean;
  codAvailable: boolean;
};

export function DeliveryPincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [isPending, startTransition] = useTransition();

  function check() {
    const value = pincode.trim();
    if (!/^\d{6}$/.test(value)) {
      setError("Enter a valid 6-digit pincode");
      setEstimate(null);
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await checkDeliveryEstimate(value);
      if (!result.success) {
        setError(result.error);
        setEstimate(null);
        return;
      }
      setEstimate(result.data);
    });
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
                  if (estimate) setEstimate(null);
                }}
                placeholder="Enter pincode"
                aria-label="Delivery pincode"
                autoComplete="postal-code"
                className={cn(
                  "h-10 w-full rounded-full border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#8b2e2e]",
                  error ? "border-red-300" : "border-neutral-200",
                )}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 shrink-0 rounded-full bg-[#8b2e2e] px-5 text-sm font-medium text-white transition hover:bg-[#7a2727] disabled:opacity-60"
            >
              {isPending ? "Checking…" : "Check"}
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
                    {estimate.city ? ` (${estimate.city}` : ""}
                    {estimate.state ? `, ${estimate.state}` : ""}
                    {estimate.city || estimate.state ? ")" : ""}
                    {estimate.isFast ? " · express corridor" : ""}.
                  </p>
                  {estimate.distanceText || estimate.durationText ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      Route estimate
                      {estimate.distanceText
                        ? `: ${estimate.distanceText}`
                        : ""}
                      {estimate.durationText
                        ? ` · ${estimate.durationText} drive`
                        : ""}
                    </p>
                  ) : null}
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

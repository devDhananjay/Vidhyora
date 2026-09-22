import type { ProductPolicy as PolicyType } from "@prisma/client";
import { RotateCcw, ShieldCheck, Clock } from "lucide-react";

export function ProductPolicy({ policy }: { policy: PolicyType }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
      <h2 className="mb-5 font-serif text-2xl text-brand md:text-3xl">
        Return & Warranty Policy
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {policy.returnAllowed && (
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-1 size-5 text-brand" strokeWidth={1.7} />
            <div>
              <div className="font-medium text-neutral-900">
                {policy.returnWindowDays}-Day Return
              </div>
              <div className="text-sm text-muted-foreground">
                Return within {policy.returnWindowDays} days of delivery
              </div>
            </div>
          </div>
        )}

        {policy.replacementAllowed && (
          <div className="flex items-start gap-3">
            <Clock className="mt-1 size-5 text-brand" strokeWidth={1.7} />
            <div>
              <div className="font-medium text-neutral-900">
                {policy.replacementWindowDays}-Day Replacement
              </div>
              <div className="text-sm text-muted-foreground">
                Get replacement within {policy.replacementWindowDays} days
              </div>
            </div>
          </div>
        )}

        {policy.warrantyAvailable && (
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 text-brand" strokeWidth={1.7} />
            <div>
              <div className="font-medium text-neutral-900">
                {policy.warrantyMonths}-Month Warranty
              </div>
              <div className="text-sm text-muted-foreground">
                Manufacturer warranty included
              </div>
            </div>
          </div>
        )}
      </div>

      {policy.policyDescription && (
        <div className="mt-4 text-sm text-muted-foreground">
          {policy.policyDescription}
        </div>
      )}
    </div>
  );
}

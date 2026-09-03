import type { ProductPolicy as PolicyType } from "@prisma/client";
import { RotateCcw, ShieldCheck, Clock } from "lucide-react";

export function ProductPolicy({ policy }: { policy: PolicyType }) {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-xl font-bold">Return & Warranty Policy</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {policy.returnAllowed && (
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-1 size-5 text-primary" />
            <div>
              <div className="font-medium">
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
            <Clock className="mt-1 size-5 text-primary" />
            <div>
              <div className="font-medium">
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
            <ShieldCheck className="mt-1 size-5 text-primary" />
            <div>
              <div className="font-medium">
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

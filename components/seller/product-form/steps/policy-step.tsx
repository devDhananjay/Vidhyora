import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import {
  DEFAULT_POLICY_WINDOW_DAYS,
  POLICY_WINDOW_OPTIONS,
} from "@/lib/products/policy-window-options";

type PolicyStepProps = {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
};

export function PolicyStep({ watch, setValue }: PolicyStepProps) {
  const returnAllowed = watch("policy.returnAllowed");
  const replacementAllowed = watch("policy.replacementAllowed");
  const warrantyAvailable = watch("policy.warrantyAvailable");
  const returnWindowDays = watch("policy.returnWindowDays");
  const replacementWindowDays = watch("policy.replacementWindowDays");
  const warrantyMonths = watch("policy.warrantyMonths");

  const windowSelectValue = (days: unknown) => {
    if (days == null || days === "" || Number(days) <= 0) return "";
    return String(days);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Product Policies</h3>
        <p className="text-sm text-muted-foreground">
          Define return, replacement, and warranty policies for this product
        </p>
      </div>

      {/* Return Policy */}
      <div className="space-y-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="returnAllowed" className="cursor-pointer">
              Return Allowed
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow customers to return this product
            </p>
          </div>
          <Switch
            id="returnAllowed"
            checked={returnAllowed}
            onCheckedChange={(checked) => {
              setValue("policy.returnAllowed", checked);
              if (checked && !(Number(returnWindowDays) > 0)) {
                setValue(
                  "policy.returnWindowDays",
                  DEFAULT_POLICY_WINDOW_DAYS,
                );
              }
            }}
          />
        </div>

        {returnAllowed && (
          <div>
            <Label htmlFor="returnWindowDays">Return Window</Label>
            <NativeSelect
              id="returnWindowDays"
              className="mt-2"
              value={windowSelectValue(returnWindowDays)}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  setValue("policy.returnAllowed", false);
                  setValue("policy.returnWindowDays", undefined);
                  return;
                }
                setValue("policy.returnWindowDays", Number(v));
              }}
            >
              {POLICY_WINDOW_OPTIONS.filter((o) => o.value !== "").map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </NativeSelect>
            <p className="mt-1 text-xs text-muted-foreground">
              Number of days after delivery for returns
            </p>
          </div>
        )}
      </div>

      {/* Replacement Policy */}
      <div className="space-y-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="replacementAllowed" className="cursor-pointer">
              Replacement Allowed
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow customers to request replacement
            </p>
          </div>
          <Switch
            id="replacementAllowed"
            checked={replacementAllowed}
            onCheckedChange={(checked) => {
              setValue("policy.replacementAllowed", checked);
              if (checked && !(Number(replacementWindowDays) > 0)) {
                setValue(
                  "policy.replacementWindowDays",
                  DEFAULT_POLICY_WINDOW_DAYS,
                );
              }
            }}
          />
        </div>

        {replacementAllowed && (
          <div>
            <Label htmlFor="replacementWindowDays">Replacement Window</Label>
            <NativeSelect
              id="replacementWindowDays"
              className="mt-2"
              value={windowSelectValue(replacementWindowDays)}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  setValue("policy.replacementAllowed", false);
                  setValue("policy.replacementWindowDays", undefined);
                  return;
                }
                setValue("policy.replacementWindowDays", Number(v));
              }}
            >
              {POLICY_WINDOW_OPTIONS.filter((o) => o.value !== "").map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </NativeSelect>
            <p className="mt-1 text-xs text-muted-foreground">
              Number of days after delivery for replacements
            </p>
          </div>
        )}
      </div>

      {/* Warranty Policy */}
      <div className="space-y-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="warrantyAvailable" className="cursor-pointer">
              Warranty Available
            </Label>
            <p className="text-sm text-muted-foreground">
              Offer warranty for this product
            </p>
          </div>
          <Switch
            id="warrantyAvailable"
            checked={warrantyAvailable}
            onCheckedChange={(checked) =>
              setValue("policy.warrantyAvailable", checked)
            }
          />
        </div>

        {warrantyAvailable && (
          <div>
            <Label htmlFor="warrantyMonths">Warranty Period (Months)</Label>
            <NativeSelect
              id="warrantyMonths"
              className="mt-2"
              value={
                warrantyMonths != null && Number(warrantyMonths) > 0
                  ? String(warrantyMonths)
                  : "12"
              }
              onChange={(e) =>
                setValue("policy.warrantyMonths", Number(e.target.value))
              }
            >
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
            </NativeSelect>
            <p className="mt-1 text-xs text-muted-foreground">
              Warranty coverage in months
            </p>
          </div>
        )}
      </div>

      {/* Policy Description */}
      <div>
        <Label htmlFor="policyDescription">
          Additional Policy Details (Optional)
        </Label>
        <Textarea
          id="policyDescription"
          value={watch("policy.policyDescription") || ""}
          onChange={(e) =>
            setValue("policy.policyDescription", e.target.value)
          }
          placeholder="Describe any additional terms, conditions, or policy details..."
          rows={4}
          className="mt-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Any additional information customers should know about your policies
        </p>
      </div>
    </div>
  );
}

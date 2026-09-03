import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PolicyStepProps = {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
};

export function PolicyStep({ register, watch, setValue, errors }: PolicyStepProps) {
  const returnAllowed = watch("policy.returnAllowed");
  const replacementAllowed = watch("policy.replacementAllowed");
  const warrantyAvailable = watch("policy.warrantyAvailable");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Product Policies</h3>
        <p className="text-sm text-muted-foreground">
          Define return, replacement, and warranty policies for this product
        </p>
      </div>

      {/* Return Policy */}
      <div className="space-y-4 rounded-lg border p-4">
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
            onCheckedChange={(checked) => setValue("policy.returnAllowed", checked)}
          />
        </div>

        {returnAllowed && (
          <div>
            <Label htmlFor="returnWindowDays">Return Window (Days)</Label>
            <Input
              id="returnWindowDays"
              type="number"
              {...register("policy.returnWindowDays", { valueAsNumber: true })}
              placeholder="7"
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Number of days after delivery for returns
            </p>
          </div>
        )}
      </div>

      {/* Replacement Policy */}
      <div className="space-y-4 rounded-lg border p-4">
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
            onCheckedChange={(checked) => setValue("policy.replacementAllowed", checked)}
          />
        </div>

        {replacementAllowed && (
          <div>
            <Label htmlFor="replacementWindowDays">Replacement Window (Days)</Label>
            <Input
              id="replacementWindowDays"
              type="number"
              {...register("policy.replacementWindowDays", { valueAsNumber: true })}
              placeholder="7"
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Number of days after delivery for replacements
            </p>
          </div>
        )}
      </div>

      {/* Warranty Policy */}
      <div className="space-y-4 rounded-lg border p-4">
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
            onCheckedChange={(checked) => setValue("policy.warrantyAvailable", checked)}
          />
        </div>

        {warrantyAvailable && (
          <div>
            <Label htmlFor="warrantyMonths">Warranty Period (Months)</Label>
            <Input
              id="warrantyMonths"
              type="number"
              {...register("policy.warrantyMonths", { valueAsNumber: true })}
              placeholder="12"
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Warranty coverage in months
            </p>
          </div>
        )}
      </div>

      {/* Policy Description */}
      <div>
        <Label htmlFor="policyDescription">Additional Policy Details (Optional)</Label>
        <Textarea
          id="policyDescription"
          {...register("policy.policyDescription")}
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

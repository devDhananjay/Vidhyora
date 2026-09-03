import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type PricingStepProps = {
  register: any;
  errors: any;
  watch: any;
  variants: any[];
};

export function PricingStep({ register, errors, watch, variants }: PricingStepProps) {
  return (
    <div className="space-y-6">
      {/* Base Pricing */}
      <div>
        <h3 className="font-medium">Base Pricing</h3>
        <p className="text-sm text-muted-foreground">
          Set the base price (will be calculated from the lowest variant price)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="basePrice">Base Price (₹) *</Label>
          <Input
            id="basePrice"
            type="number"
            step="0.01"
            {...register("basePrice", { valueAsNumber: true })}
            placeholder="999.00"
            className="mt-2"
          />
          {errors.basePrice && (
            <p className="mt-1 text-sm text-destructive">{errors.basePrice.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="compareAtPrice">Compare At Price (₹)</Label>
          <Input
            id="compareAtPrice"
            type="number"
            step="0.01"
            {...register("compareAtPrice", { valueAsNumber: true })}
            placeholder="1299.00"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Original price for showing discounts
          </p>
          {errors.compareAtPrice && (
            <p className="mt-1 text-sm text-destructive">{errors.compareAtPrice.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tax">Tax Rate (%)</Label>
          <Input
            id="tax"
            type="number"
            step="0.01"
            {...register("tax", { valueAsNumber: true })}
            placeholder="18"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            GST or applicable tax percentage
          </p>
          {errors.tax && (
            <p className="mt-1 text-sm text-destructive">{errors.tax.message}</p>
          )}
        </div>
      </div>

      {/* Variant Pricing & Stock */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Variant Pricing & Stock</h3>
          <p className="text-sm text-muted-foreground">
            Set individual prices and stock levels for each variant
          </p>
        </div>

        {variants.map((variant, index) => {
          const variantName =
            watch(`variants.${index}.attributes.name`) ||
            watch(`variants.${index}.sku`) ||
            `Variant ${index + 1}`;

          return (
            <Card key={variant.id}>
              <CardContent className="p-4">
                <h4 className="mb-4 font-medium">{variantName}</h4>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Price */}
                  <div>
                    <Label htmlFor={`variants.${index}.price`}>Price (₹) *</Label>
                    <Input
                      id={`variants.${index}.price`}
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.price`, { valueAsNumber: true })}
                      placeholder="999.00"
                      className="mt-2"
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.variants[index].price.message}
                      </p>
                    )}
                  </div>

                  {/* Compare At Price */}
                  <div>
                    <Label htmlFor={`variants.${index}.compareAtPrice`}>
                      Compare At (₹)
                    </Label>
                    <Input
                      id={`variants.${index}.compareAtPrice`}
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.compareAtPrice`, {
                        valueAsNumber: true,
                      })}
                      placeholder="1299.00"
                      className="mt-2"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <Label htmlFor={`variants.${index}.stock`}>Stock Quantity *</Label>
                    <Input
                      id={`variants.${index}.stock`}
                      type="number"
                      {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                      placeholder="100"
                      className="mt-2"
                    />
                    {errors.variants?.[index]?.stock && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.variants[index].stock.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

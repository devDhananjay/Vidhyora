import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type VariantsStepProps = {
  variants: any[];
  register: any;
  control: any;
  errors: any;
  append: any;
  remove: any;
};

export function VariantsStep({
  variants,
  register,
  errors,
  append,
  remove,
}: VariantsStepProps) {
  const handleAddVariant = () => {
    append({
      sku: "",
      attributes: {},
      price: 0,
      stock: 0,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Product Variants</h3>
        <p className="text-sm text-muted-foreground">
          Add different variations of your product (e.g., different sizes, colors, storage options)
        </p>
      </div>

      {/* Variants List */}
      <div className="space-y-4">
        {variants.map((variant, index) => (
          <Card key={variant.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <h4 className="font-medium">Variant {index + 1}</h4>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {/* SKU */}
                <div>
                  <Label htmlFor={`variants.${index}.sku`}>SKU *</Label>
                  <Input
                    id={`variants.${index}.sku`}
                    {...register(`variants.${index}.sku`)}
                    placeholder="IPHONE-15-PRO-256-BLACK"
                    className="mt-2"
                  />
                  {errors.variants?.[index]?.sku && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.variants[index].sku.message}
                    </p>
                  )}
                </div>

                {/* Variant Name (e.g., "256GB Black") */}
                <div>
                  <Label htmlFor={`variants.${index}.attributes.name`}>
                    Variant Name (optional)
                  </Label>
                  <Input
                    id={`variants.${index}.attributes.name`}
                    {...register(`variants.${index}.attributes.name`)}
                    placeholder="256GB Black"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Price and stock will be set in the next step
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Variant Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddVariant}
        className="w-full"
      >
        <Plus className="mr-2 size-4" />
        Add Another Variant
      </Button>

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">When to use variants?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Same product in different sizes (S, M, L, XL)</li>
          <li>• Same product in different colors</li>
          <li>• Same product with different storage/memory options</li>
          <li>• If your product has no variations, just use one variant</li>
        </ul>
      </div>
    </div>
  );
}

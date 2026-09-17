"use client";

import { useState, type ChangeEvent } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { uploadProductCertificate } from "@/actions/seller/upload-product-certificate";
import { appAlert } from "@/components/shared/app-dialog";

type PricingStepProps = {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  variants: any[];
};

function toNumber(value: string) {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function PricingStep({
  register,
  errors,
  watch,
  setValue,
  variants,
}: PricingStepProps) {
  const singleVariant = variants.length === 1;
  const certificateUrl = String(watch("certificateUrl") || "");
  const [uploadingCert, setUploadingCert] = useState(false);

  const syncBaseToVariants = (price: number | undefined) => {
    if (price == null || Number.isNaN(price)) return;
    if (singleVariant) {
      setValue("variants.0.price", price, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    // Multi-variant: keep all selling prices in sync only when they were equal
    const prices = variants.map((_, i) => Number(watch(`variants.${i}.price`)));
    const allSame = prices.every((p) => p === prices[0]);
    if (allSame) {
      variants.forEach((_, i) => {
        setValue(`variants.${i}.price`, price, {
          shouldDirty: true,
          shouldValidate: true,
        });
      });
    }
  };

  const syncCompareToVariants = (compare: number | undefined) => {
    if (singleVariant) {
      setValue("variants.0.compareAtPrice", compare ?? undefined, {
        shouldDirty: true,
      });
      return;
    }
    const compares = variants.map((_, i) =>
      Number(watch(`variants.${i}.compareAtPrice`) || 0),
    );
    const allSame = compares.every((p) => p === compares[0]);
    if (allSame) {
      variants.forEach((_, i) => {
        setValue(`variants.${i}.compareAtPrice`, compare ?? undefined, {
          shouldDirty: true,
        });
      });
    }
  };

  const basePriceRegister = register("basePrice", { valueAsNumber: true });
  const compareRegister = register("compareAtPrice", { valueAsNumber: true });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Pricing</h3>
        <p className="text-sm text-muted-foreground">
          {singleVariant
            ? "Selling price below is what customers see. Stock is set in the variant card."
            : "Each variant has its own selling price. Base Price stays in sync when all variants share the same price."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="basePrice">
            {singleVariant ? "Selling Price (₹) *" : "Base Price (₹) *"}
          </Label>
          <Input
            id="basePrice"
            type="number"
            step="0.01"
            {...basePriceRegister}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              basePriceRegister.onChange(e);
              syncBaseToVariants(toNumber(e.target.value));
            }}
            placeholder="999.00"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {singleVariant
              ? "This updates the product variant price used on the storefront."
              : "Also updates variant prices when they are all currently the same."}
          </p>
          {errors.basePrice && (
            <p className="mt-1 text-sm text-destructive">
              {errors.basePrice.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="compareAtPrice">Compare At Price (₹)</Label>
          <Input
            id="compareAtPrice"
            type="number"
            step="0.01"
            {...compareRegister}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              compareRegister.onChange(e);
              syncCompareToVariants(toNumber(e.target.value));
            }}
            placeholder="1299.00"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Original / MRP price for showing discounts
          </p>
          {errors.compareAtPrice && (
            <p className="mt-1 text-sm text-destructive">
              {errors.compareAtPrice.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="tax">Tax Rate (%)</Label>
          <Input
            id="tax"
            type="number"
            step="0.01"
            {...register("tax", { valueAsNumber: true })}
            placeholder="3"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Jewellery GST is typically 3%
          </p>
          {errors.tax && (
            <p className="mt-1 text-sm text-destructive">{errors.tax.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="hsn">HSN code</Label>
          <Input
            id="hsn"
            {...register("hsn")}
            placeholder="711319"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on tax invoices (default 711319 for jewellery)
          </p>
        </div>

        <div>
          <Label htmlFor="certificateNumber">Certificate number</Label>
          <Input
            id="certificateNumber"
            {...register("certificateNumber")}
            placeholder="IGI / GIA / BIS hall mark no."
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on product page and order invoice when set
          </p>
        </div>

        <div>
          <Label htmlFor="certificateFile">Certificate / hallmark file</Label>
          <input type="hidden" {...register("certificateUrl")} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              id="certificateFile"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={uploadingCert}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setUploadingCert(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const result = await uploadProductCertificate(formData);
                  if (!result.success || !result.data?.url) {
                    await appAlert(result.error || "Upload failed", {
                      variant: "error",
                    });
                    return;
                  }
                  setValue("certificateUrl", result.data.url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                } finally {
                  setUploadingCert(false);
                }
              }}
            />
            {uploadingCert ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Uploading…
              </span>
            ) : null}
          </div>
          {certificateUrl ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
              <FileText className="size-4 text-[#8b2e2e]" />
              <a
                href={certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-[#8b2e2e] underline-offset-2 hover:underline"
              >
                {certificateUrl.split("/").pop() || "View certificate"}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-neutral-600"
                onClick={() =>
                  setValue("certificateUrl", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Remove certificate</span>
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              PDF or image buyers can download from the product page
            </p>
          )}
          {errors.certificateUrl ? (
            <p className="mt-1 text-xs text-destructive">
              {String(errors.certificateUrl.message || "Invalid file")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="attributes.makingChargePercent">
            Making charge (%)
          </Label>
          <Input
            id="attributes.makingChargePercent"
            type="number"
            step="0.01"
            {...register("attributes.makingChargePercent")}
            placeholder="22"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Used for price breakup when metal rate is not set
          </p>
        </div>

        <div>
          <Label htmlFor="attributes.metalRatePerGram">
            Metal rate (₹/g)
          </Label>
          <Input
            id="attributes.metalRatePerGram"
            type="number"
            step="0.01"
            {...register("attributes.metalRatePerGram")}
            placeholder="6500"
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            With product weight, this drives metal vs making on invoices
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">
            {singleVariant ? "Stock" : "Variant Pricing & Stock"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {singleVariant
              ? "How many pieces are available for this product."
              : "Set individual prices and stock for each size / option."}
          </p>
        </div>

        {variants.map((variant, index) => {
          const variantName =
            watch(`variants.${index}.attributes.name`) ||
            watch(`variants.${index}.sku`) ||
            `Variant ${index + 1}`;

          const priceRegister = register(`variants.${index}.price`, {
            valueAsNumber: true,
          });
          const variantCompareRegister = register(
            `variants.${index}.compareAtPrice`,
            { valueAsNumber: true },
          );

          return (
            <Card key={variant.id}>
              <CardContent className="p-4">
                <h4 className="mb-4 font-medium">{variantName}</h4>

                <div
                  className={
                    singleVariant
                      ? "grid gap-4 md:grid-cols-1 max-w-xs"
                      : "grid gap-4 md:grid-cols-3"
                  }
                >
                  {!singleVariant ? (
                    <>
                      <div>
                        <Label htmlFor={`variants.${index}.price`}>
                          Price (₹) *
                        </Label>
                        <Input
                          id={`variants.${index}.price`}
                          type="number"
                          step="0.01"
                          {...priceRegister}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            priceRegister.onChange(e);
                            const n = toNumber(e.target.value);
                            if (n != null) {
                              const otherPrices = variants
                                .map((_, i) =>
                                  i === index
                                    ? n
                                    : Number(watch(`variants.${i}.price`)),
                                )
                                .filter((p) => !Number.isNaN(p));
                              if (otherPrices.length > 0) {
                                setValue("basePrice", Math.min(...otherPrices), {
                                  shouldDirty: true,
                                });
                              }
                            }
                          }}
                          placeholder="999.00"
                          className="mt-2"
                        />
                        {errors.variants?.[index]?.price && (
                          <p className="mt-1 text-sm text-destructive">
                            {errors.variants[index].price.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`variants.${index}.compareAtPrice`}>
                          Compare At (₹)
                        </Label>
                        <Input
                          id={`variants.${index}.compareAtPrice`}
                          type="number"
                          step="0.01"
                          {...variantCompareRegister}
                          placeholder="1299.00"
                          className="mt-2"
                        />
                      </div>
                    </>
                  ) : null}

                  <div>
                    <Label htmlFor={`variants.${index}.stock`}>
                      Stock Quantity *
                    </Label>
                    <Input
                      id={`variants.${index}.stock`}
                      type="number"
                      {...register(`variants.${index}.stock`, {
                        valueAsNumber: true,
                      })}
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

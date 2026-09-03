import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Check, X } from "lucide-react";

type PreviewStepProps = {
  watch: any;
  categories: any[];
};

export function PreviewStep({ watch, categories }: PreviewStepProps) {
  const formData = watch();
  const category = categories.find((c) => c.id === formData.categoryId);

  const calculateDiscount = (price: number, compareAt?: number) => {
    if (!compareAt || compareAt <= price) return null;
    const discount = ((compareAt - price) / compareAt) * 100;
    return Math.round(discount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Review Your Product</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting for admin approval
        </p>
      </div>

      {/* Basic Info Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Product Name</div>
            <div className="font-medium">{formData.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Brand</div>
            <div className="font-medium">{formData.brand}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Category</div>
            <div className="font-medium">{category?.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Slug</div>
            <div className="font-mono text-sm">{formData.slug}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Short Description</div>
            <div className="text-sm">{formData.shortDescription}</div>
          </div>
        </CardContent>
      </Card>

      {/* Images Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {formData.images?.map((img: any, index: number) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-lg border"
              >
                <Image src={img.url} alt={img.altText || "Product"} fill className="object-cover" />
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                    Thumbnail
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variants & Pricing Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variants & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Base Price</div>
              <div className="text-2xl font-bold">{formatCurrency(formData.basePrice)}</div>
              {formData.compareAtPrice && formData.compareAtPrice > formData.basePrice && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(formData.compareAtPrice)}
                  </span>
                  <Badge className="bg-green-600">
                    {calculateDiscount(formData.basePrice, formData.compareAtPrice)}% OFF
                  </Badge>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tax Rate</div>
              <div className="text-lg font-semibold">{formData.tax}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Variants</div>
              <div className="text-lg font-semibold">{formData.variants?.length || 0}</div>
            </div>
          </div>

          <div className="space-y-2">
            {formData.variants?.map((variant: any, index: number) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">
                    {variant.attributes?.name || variant.sku || `Variant ${index + 1}`}
                  </div>
                  <div className="text-sm text-muted-foreground">SKU: {variant.sku}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(variant.price)}</div>
                  <div className="text-sm text-muted-foreground">{variant.stock} in stock</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policy Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {formData.policy?.returnAllowed ? (
              <Check className="size-5 text-green-600" />
            ) : (
              <X className="size-5 text-muted-foreground" />
            )}
            <span>
              Returns{" "}
              {formData.policy?.returnAllowed
                ? `(${formData.policy.returnWindowDays} days)`
                : "Not Available"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {formData.policy?.replacementAllowed ? (
              <Check className="size-5 text-green-600" />
            ) : (
              <X className="size-5 text-muted-foreground" />
            )}
            <span>
              Replacement{" "}
              {formData.policy?.replacementAllowed
                ? `(${formData.policy.replacementWindowDays} days)`
                : "Not Available"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {formData.policy?.warrantyAvailable ? (
              <Check className="size-5 text-green-600" />
            ) : (
              <X className="size-5 text-muted-foreground" />
            )}
            <span>
              Warranty{" "}
              {formData.policy?.warrantyAvailable
                ? `(${formData.policy.warrantyMonths} months)`
                : "Not Available"}
            </span>
          </div>
          {formData.policy?.policyDescription && (
            <div className="mt-3 rounded-lg bg-muted p-3">
              <div className="text-sm font-medium">Additional Details:</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formData.policy.policyDescription}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/10">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
          ⚠️ Before Submitting
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
          <li>• Your product will be submitted for admin approval</li>
          <li>• You'll be notified once approved or if changes are needed</li>
          <li>• Make sure all information is accurate and complete</li>
          <li>• Images should be high quality and represent the product accurately</li>
        </ul>
      </div>
    </div>
  );
}

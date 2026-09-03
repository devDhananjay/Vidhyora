"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, type CreateProductInput } from "@/lib/validations/product";
import { createProduct, saveProductDraft, updateProduct } from "@/actions/seller/manage-products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";

import { BasicInfoStep } from "./steps/basic-info-step";
import { ImagesStep } from "./steps/images-step";
import { VariantsStep } from "./steps/variants-step";
import { PricingStep } from "./steps/pricing-step";
import { PolicyStep } from "./steps/policy-step";
import { PreviewStep } from "./steps/preview-step";

const STEPS = [
  { id: 1, title: "Basic Info", description: "Product name, brand, category" },
  { id: 2, title: "Images", description: "Product photos and gallery" },
  { id: 3, title: "Variants", description: "Size, color, or other options" },
  { id: 4, title: "Pricing", description: "Price and stock levels" },
  { id: 5, title: "Policies", description: "Return, warranty, shipping" },
  { id: 6, title: "Preview", description: "Review and submit" },
];

const DRAFT_STORAGE_KEY = "vidyora.product-draft";

type ProductFormProps = {
  categories: any[];
  product?: any;
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [savedSteps, setSavedSteps] = useState<number[]>(product ? [1, 2, 3, 4, 5, 6] : []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftProductId, setDraftProductId] = useState<string | undefined>(product?.id);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          categoryId: product.categoryId,
          shortDescription: product.shortDescription,
          description: product.description,
          thumbnail: product.thumbnail,
          images: product.images || [],
          variants: product.variants || [],
          policy: product.policy || {},
          basePrice: Number(product.basePrice) || 0,
          compareAtPrice: product.compareAtPrice
            ? Number(product.compareAtPrice)
            : undefined,
          tax: Number(product.tax) || 0,
        }
      : {
          variants: [
            {
              sku: "",
              attributes: {},
              price: 0,
              stock: 0,
              isActive: true,
            },
          ],
          policy: {
            returnAllowed: false,
            replacementAllowed: false,
            warrantyAvailable: false,
          },
          tax: 0,
          images: [],
        },
  });

  const { fields: variants, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  useEffect(() => {
    if (product) return;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        values?: CreateProductInput;
        step?: number;
        savedSteps?: number[];
        productId?: string;
      };
      if (draft.values) reset(draft.values);
      if (draft.step) setCurrentStep(draft.step);
      if (draft.savedSteps) setSavedSteps(draft.savedSteps);
      if (draft.productId) setDraftProductId(draft.productId);
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [product, reset]);

  const persistLocalDraft = (step = currentStep, extraSaved = savedSteps) => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        values: getValues(),
        step,
        savedSteps: extraSaved,
        productId: draftProductId,
      }),
    );
  };

  const goToStep = (stepId: number) => {
    persistLocalDraft(stepId);
    setCurrentStep(stepId);
    setSaveMessage(null);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const handleSaveStep = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    const nextSaved = Array.from(new Set([...savedSteps, currentStep])).sort(
      (a, b) => a - b,
    );
    setSavedSteps(nextSaved);
    persistLocalDraft(currentStep, nextSaved);

    try {
      const result = await saveProductDraft(draftProductId, getValues());
      if (result.success) {
        setDraftProductId(result.data.id);
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            values: getValues(),
            step: currentStep,
            savedSteps: nextSaved,
            productId: result.data.id,
          }),
        );
        setSaveMessage(
          currentStep === STEPS.length
            ? "Draft saved. Submit when you are ready."
            : `${STEPS[currentStep - 1].title} saved. You can jump to any other step.`,
        );
      } else {
        setSaveMessage(
          result.error ||
            "Saved on this device. Add name and category to save as an online draft.",
        );
      }
    } catch {
      setSaveMessage("Saved on this device. You can continue any step.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: CreateProductInput) => {
    setIsSubmitting(true);

    try {
      const result = product || draftProductId
        ? await updateProduct(product?.id || draftProductId!, data)
        : await createProduct(data);

      if (result.success) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        alert(
          product
            ? "Product updated successfully! Awaiting admin approval."
            : "Product created successfully! Awaiting admin approval.",
        );
        router.push("/seller/products");
        router.refresh();
      } else {
        alert(result.error);
      }
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (savedSteps.length / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            categories={categories}
          />
        );
      case 2:
        return <ImagesStep watch={watch} setValue={setValue} errors={errors} />;
      case 3:
        return (
          <VariantsStep
            variants={variants}
            register={register}
            control={control}
            errors={errors}
            append={append}
            remove={remove}
          />
        );
      case 4:
        return (
          <PricingStep
            register={register}
            errors={errors}
            watch={watch}
            variants={variants}
          />
        );
      case 5:
        return (
          <PolicyStep
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        );
      case 6:
        return <PreviewStep watch={watch} categories={categories} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Step {currentStep} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}% saved</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="flex justify-between gap-2">
        {STEPS.map((step) => {
          const isCurrent = currentStep === step.id;
          const isSaved = savedSteps.includes(step.id);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(step.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-xl p-2 text-center transition hover:bg-[#f6ebe8]",
                isCurrent && "text-primary",
                isSaved && !isCurrent && "text-green-700",
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  isSaved && !isCurrent && "border-green-600 bg-green-600 text-white",
                  !isCurrent && !isSaved && "border-muted-foreground/30",
                )}
              >
                {isSaved && !isCurrent ? <Check className="size-5" /> : step.id}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            {saveMessage ? (
              <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {saveMessage}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting || isSaving}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveStep}
                  disabled={isSubmitting || isSaving}
                  className="border-[#8b2e2e] text-[#8b2e2e] hover:bg-[#f6ebe8]"
                >
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Saving..." : "Save this step"}
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting || isSaving}
                  >
                    Next
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || isSaving}>
                    {isSubmitting
                      ? "Submitting..."
                      : product
                        ? "Update Product"
                        : "Submit for Approval"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

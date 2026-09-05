"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProductSchema,
  normalizeProductFormValues,
  type CreateProductInput,
} from "@/lib/validations/product";
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

function collectErrorMessages(formErrors: Record<string, any>): string[] {
  const messages: string[] = [];
  if (formErrors.thumbnail || formErrors.images) {
    messages.push("Add at least one product image (Step 2)");
  }
  if (
    formErrors.name ||
    formErrors.slug ||
    formErrors.brand ||
    formErrors.categoryId
  ) {
    messages.push("Complete Basic Info: name, slug, brand, category (Step 1)");
  }
  if (formErrors.shortDescription || formErrors.description) {
    messages.push(
      "Short description needs 20+ chars and full description 50+ chars (Step 1)",
    );
  }
  if (formErrors.variants) {
    messages.push("Check variant SKU (3+ chars), price, and stock (Steps 3–4)");
  }
  if (formErrors.basePrice || formErrors.tax || formErrors.compareAtPrice) {
    messages.push("Check pricing fields (Step 4)");
  }
  if (formErrors.policy) {
    messages.push("Check return/warranty policy numbers (Step 5)");
  }
  if (messages.length === 0) {
    messages.push("Some required fields are incomplete. Check each step.");
  }
  return messages;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isExisting = Boolean(product?.id);
  const needsApprovalSubmit =
    !product ||
    product.approvalStatus === "DRAFT" ||
    product.approvalStatus === "PENDING_APPROVAL" ||
    product.approvalStatus === "REJECTED";

  const [currentStep, setCurrentStep] = useState(1);
  const [savedSteps, setSavedSteps] = useState<number[]>(
    isExisting ? [1, 2, 3, 4, 5, 6] : [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftProductId, setDraftProductId] = useState<string | undefined>(
    product?.id,
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const defaultValues: CreateProductInput = product
    ? normalizeProductFormValues(product)
    : {
        name: "",
        slug: "",
        brand: "",
        categoryId: "",
        shortDescription: "",
        description: "",
        thumbnail: "",
        images: [],
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
        basePrice: 0,
        tax: 0,
      };

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
    // Zod preprocess + RHF resolver types don't align perfectly
    resolver: zodResolver(createProductSchema) as any,
    defaultValues,
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const { fields: variants, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const watchedImages = watch("images");
  const watchedName = watch("name");
  const watchedSku = watch("variants.0.sku");

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
    if (isExisting) return;
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
    if (currentStep < STEPS.length) goToStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
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
        if (!isExisting) {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              values: getValues(),
              step: currentStep,
              savedSteps: nextSaved,
              productId: result.data.id,
            }),
          );
        }
        setSaveMessage(
          currentStep === STEPS.length
            ? "Draft saved. Now click Submit for Approval below."
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
    setSaveMessage(null);

    try {
      const targetId = product?.id || draftProductId;
      const result = targetId
        ? await updateProduct(targetId, data)
        : await createProduct(data);

      if (result.success) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        alert(
          needsApprovalSubmit
            ? "Product submitted for Super Admin approval."
            : "Product updated successfully.",
        );
        router.push("/seller/products");
        router.refresh();
      } else {
        setSaveMessage(result.error || "Submit failed. Please try again.");
        alert(result.error || "Submit failed. Please try again.");
      }
    } catch {
      setSaveMessage("An error occurred. Please try again.");
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const fieldToStep: Record<string, number> = {
      name: 1,
      slug: 1,
      brand: 1,
      categoryId: 1,
      shortDescription: 1,
      description: 1,
      thumbnail: 2,
      images: 2,
      variants: 3,
      basePrice: 4,
      compareAtPrice: 4,
      tax: 4,
      policy: 5,
    };

    const keys = Object.keys(formErrors);
    const firstKey = keys[0];
    const step = firstKey ? fieldToStep[firstKey] ?? 1 : 1;
    goToStep(step);

    const messages = collectErrorMessages(formErrors as Record<string, any>);
    setSaveMessage(`Cannot submit yet: ${messages.join(" ")}`);
  };

  const handleFinalSubmit = async () => {
    const values = getValues();
    const prices = (values.variants ?? [])
      .map((variant) => Number(variant.price))
      .filter((price) => !Number.isNaN(price) && price >= 0);
    if (prices.length > 0) {
      setValue("basePrice", Math.min(...prices), { shouldValidate: false });
    }
    if (!values.thumbnail && values.images?.[0]?.url) {
      setValue("thumbnail", values.images[0].url, { shouldValidate: false });
    }

    await handleSubmit(onSubmit, onInvalid)();
  };

  const progress = (savedSteps.length / STEPS.length) * 100;
  const imageCount = watchedImages?.length ?? 0;
  const canSubmitChecklist = [
    { ok: Boolean(watchedName && watchedName.length >= 3), label: "Product name" },
    { ok: imageCount > 0, label: "At least 1 image" },
    { ok: Boolean(watchedSku && watchedSku.length >= 3), label: "Variant SKU" },
  ];

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
    <div className="space-y-4 pb-28 sm:space-y-6 sm:pb-0">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Step {currentStep} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}% saved</span>
        </div>
        <Progress value={progress} />
        <p className="text-sm font-medium text-[#8b2e2e] md:hidden">
          {STEPS[currentStep - 1].title}
        </p>
      </div>

      {/* Mobile: horizontal scroll chips. Desktop: full stepper */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((step) => {
            const isCurrent = currentStep === step.id;
            const isSaved = savedSteps.includes(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left transition",
                  isCurrent
                    ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                    : isSaved
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-neutral-200 bg-white text-neutral-600",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    isCurrent
                      ? "bg-white/20"
                      : isSaved
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-100",
                  )}
                >
                  {isSaved && !isCurrent ? <Check className="size-3.5" /> : step.id}
                </span>
                <span className="text-[12px] font-medium whitespace-nowrap">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden justify-between gap-2 md:flex">
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
              <div>
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
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="text-xl sm:text-2xl">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div>
            {renderStep()}

            {saveMessage ? (
              <p
                className={`mt-6 rounded-lg px-3 py-2 text-sm ${
                  saveMessage.startsWith("Cannot submit")
                    ? "bg-red-50 text-red-800"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {saveMessage}
              </p>
            ) : null}

            {currentStep === STEPS.length ? (
              <div className="mt-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p>
                  <strong>Save this step</strong> only keeps a draft. To send for
                  review, click <strong>Submit for Approval</strong>.
                </p>
                <ul className="space-y-1">
                  {canSubmitChecklist.map((item) => (
                    <li key={item.label} className="flex items-center gap-2">
                      <span
                        className={
                          item.ok ? "text-emerald-700" : "text-red-700"
                        }
                      >
                        {item.ok ? "✓" : "✗"}
                      </span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Desktop actions */}
            <div className="mt-8 hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
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
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || isSaving}
                    className="min-w-[180px] bg-[#8b2e2e] text-white hover:bg-[#6f2424]"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : needsApprovalSubmit
                        ? "Submit for Approval"
                        : "Update Product"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting || isSaving}
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveStep}
            disabled={isSubmitting || isSaving}
            className="shrink-0 border-[#8b2e2e] text-[#8b2e2e]"
          >
            <Save className="mr-1 size-4" />
            {isSaving ? "..." : "Save"}
          </Button>
          {currentStep < STEPS.length ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              disabled={isSubmitting || isSaving}
              className="min-w-0 flex-1"
            >
              Next
              <ArrowRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleFinalSubmit}
              disabled={isSubmitting || isSaving}
              className="min-w-0 flex-1 bg-[#8b2e2e] text-white hover:bg-[#6f2424]"
            >
              {isSubmitting
                ? "..."
                : needsApprovalSubmit
                  ? "Submit"
                  : "Update"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

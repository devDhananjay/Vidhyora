import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckoutStepsProps = {
  currentStep: number;
};

const steps = [
  { number: 1, label: "Address" },
  { number: 2, label: "Review" },
  { number: 3, label: "Payment" },
  { number: 4, label: "Confirm" },
];

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-1 sm:justify-center sm:gap-0">
      {steps.map((step, index) => (
        <div key={step.number} className="flex min-w-0 items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center sm:flex-row">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold sm:size-10 sm:text-base",
                step.number < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.number === currentStep
                    ? "border-primary bg-background text-primary"
                    : "border-muted-foreground/30 bg-background text-muted-foreground",
              )}
            >
              {step.number < currentStep ? (
                <Check className="size-4 sm:size-5" />
              ) : (
                step.number
              )}
            </div>
            <div className="mt-1 max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:ml-2 sm:mt-0 sm:max-w-none sm:text-left sm:text-sm">
              {step.label}
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-1 h-0.5 w-4 shrink-0 sm:mx-4 sm:w-12 md:w-24",
                step.number < currentStep
                  ? "bg-primary"
                  : "bg-muted-foreground/30",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

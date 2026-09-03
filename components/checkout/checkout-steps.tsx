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
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div className="flex items-center">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full border-2 font-semibold",
                step.number < currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.number === currentStep
                    ? "border-primary bg-background text-primary"
                    : "border-muted-foreground/30 bg-background text-muted-foreground",
              )}
            >
              {step.number < currentStep ? (
                <Check className="size-5" />
              ) : (
                step.number
              )}
            </div>
            <div className="ml-2 hidden text-sm font-medium sm:block">
              {step.label}
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-4 h-0.5 w-12 sm:w-24",
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

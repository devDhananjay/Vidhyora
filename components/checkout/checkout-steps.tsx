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
    <nav aria-label="Checkout progress" className="mx-auto w-full max-w-3xl">
      <ol className="flex w-full">
        {steps.map((step, index) => {
          const done = step.number < currentStep;
          const active = step.number === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.number}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-4 z-0 h-0.5 w-full sm:top-5",
                    done ? "bg-primary" : "bg-neutral-200",
                  )}
                />
              ) : null}

              <div
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-white text-sm font-semibold sm:size-10 sm:text-base",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary text-primary"
                      : "border-neutral-300 text-neutral-400",
                )}
              >
                {done ? (
                  <Check className="size-4 sm:size-5" aria-hidden />
                ) : (
                  step.number
                )}
              </div>

              <span
                className={cn(
                  "mt-2 w-full px-0.5 text-center text-[11px] font-medium leading-tight sm:text-sm",
                  active || done ? "text-neutral-900" : "text-neutral-400",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

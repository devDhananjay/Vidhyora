import prisma from "@/lib/prisma";
import { Check, Circle } from "lucide-react";
import { format } from "date-fns";

type OrderTimelineProps = {
  orderId: string;
  currentStatus: string;
};

const statusFlow = [
  "ORDERED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export async function OrderTimeline({ orderId, currentStatus }: OrderTimelineProps) {
  const history = await prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });

  const currentIndex = statusFlow.indexOf(currentStatus);

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-6 text-lg font-semibold">Order Timeline</h2>

      <div className="relative space-y-6">
        {statusFlow.map((status, index) => {
          const statusHistory = history.find((h) => h.status === status);
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status} className="relative flex items-start gap-4">
              {/* Timeline Line */}
              {index < statusFlow.length - 1 && (
                <div
                  className={`absolute left-4 top-10 h-full w-0.5 ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}

              {/* Status Icon */}
              <div
                className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "border-2 bg-background"
                }`}
              >
                {isCompleted ? (
                  <Check className="size-5" />
                ) : (
                  <Circle className="size-3" />
                )}
              </div>

              {/* Status Details */}
              <div className="flex-1 pb-6">
                <div
                  className={`font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {status.replace(/_/g, " ")}
                </div>
                {statusHistory && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {format(
                      new Date(statusHistory.createdAt),
                      "MMM dd, yyyy 'at' hh:mm a",
                    )}
                  </div>
                )}
                {statusHistory?.note && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {statusHistory.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { getPaymentStatusLabel } from "@/lib/orders/order-utils";

type PaymentStatusBadgeProps = {
  status: string;
  provider?: string | null;
};

export function PaymentStatusBadge({
  status,
  provider,
}: PaymentStatusBadgeProps) {
  const label = getPaymentStatusLabel(status, provider);
  const paid = status === "PAID";
  const failed = status === "FAILED";
  const pendingCod = label === "PENDING (COD)";

  return (
    <Badge
      className={
        paid
          ? "bg-green-600"
          : pendingCod
            ? "bg-amber-600"
            : failed
              ? "bg-red-600"
              : "bg-yellow-600"
      }
    >
      {label}
    </Badge>
  );
}

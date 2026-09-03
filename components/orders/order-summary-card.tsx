import { formatCurrency } from "@/lib/utils";
import type { OrderWithDetails } from "@/types/order";
import { MapPin, CreditCard, Package } from "lucide-react";

type OrderSummaryCardProps = {
  order: OrderWithDetails;
};

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  return (
    <div className="space-y-6">
      {/* Price Details */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Price Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(Number(order.subtotal))}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(Number(order.discount))}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>
              {order.shippingFee > 0
                ? formatCurrency(Number(order.shippingFee))
                : "FREE"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (GST)</span>
            <span>{formatCurrency(Number(order.tax))}</span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <MapPin className="size-5" />
          <h3>Delivery Address</h3>
        </div>
        <div className="text-sm">
          <p className="font-medium">{order.shippingAddress.name}</p>
          <p className="mt-1">{order.shippingAddress.addressLine1}</p>
          {order.shippingAddress.addressLine2 && (
            <p>{order.shippingAddress.addressLine2}</p>
          )}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
            {order.shippingAddress.postalCode}
          </p>
          <p className="mt-2 text-muted-foreground">
            Phone: {order.shippingAddress.phone}
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <CreditCard className="size-5" />
          <h3>Payment</h3>
        </div>
        <div className="text-sm">
          <p>Status: {order.paymentStatus}</p>
        </div>
      </div>
    </div>
  );
}

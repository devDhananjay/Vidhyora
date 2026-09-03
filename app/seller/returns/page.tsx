import type { Metadata } from "next";
import Image from "next/image";
import { getSellerReturns } from "@/actions/seller/get-returns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Returns | Seller Dashboard",
};

function statusBadge(status: string) {
  if (status === "PENDING") return <Badge className="bg-yellow-600">Pending</Badge>;
  if (status === "APPROVED") return <Badge className="bg-green-600">Approved</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-600 text-white">Rejected</Badge>;
  if (status === "COMPLETED") return <Badge className="bg-emerald-600">Completed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default async function SellerReturnsPage() {
  const returns = await getSellerReturns();
  const pending = returns.filter((item) => item.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Returns & Replacements</h1>
        <p className="mt-2 text-muted-foreground">
          {returns.length} requests • {pending} pending review
        </p>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No return requests yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {returns.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.orderItem.product.thumbnail ? (
                      <Image
                        src={item.orderItem.product.thumbnail}
                        alt={item.orderItem.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {item.orderItem.product.name}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.orderItem.order.orderNumber} • {item.user.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        {statusBadge(item.status)}
                      </div>
                    </div>
                    <p className="mt-3 text-sm">
                      <span className="text-muted-foreground">Reason: </span>
                      {item.reason}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Requested {format(new Date(item.requestedAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

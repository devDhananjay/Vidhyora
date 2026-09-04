import type { Metadata } from "next";
import { getSellerReturns } from "@/actions/seller/get-returns";
import { ReturnModerationCard } from "@/components/returns/return-moderation-card";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Returns & Replacements | Seller Admin",
};

export default async function SellerReturnsPage() {
  const returns = await getSellerReturns();
  const pending = returns.filter((item) => item.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">
          Returns & Replacements
        </h1>
        <p className="mt-2 text-muted-foreground">
          {returns.length} requests • {pending} pending review. Approve or
          reject customer requests for this store.
        </p>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No return or replacement requests for this seller admin yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {returns.map((item) => (
            <ReturnModerationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

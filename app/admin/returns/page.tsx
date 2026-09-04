import type { Metadata } from "next";
import { getAllReturnRequests } from "@/actions/admin/manage-returns";
import { ReturnModerationCard } from "@/components/returns/return-moderation-card";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Returns & Replacements | Super Admin",
};

export default async function AdminReturnsPage() {
  const returns = await getAllReturnRequests();
  const pending = returns.filter((item) => item.status === "PENDING").length;
  const replacements = returns.filter((item) => item.type === "REPLACEMENT").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">
          Returns & Replacements
        </h1>
        <p className="mt-2 text-muted-foreground">
          {returns.length} requests across seller admins • {pending} pending •{" "}
          {replacements} replacements. Super Admin approves, rejects, or
          completes these.
        </p>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No return or replacement requests yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {returns.map((item) => (
            <ReturnModerationCard key={item.id} item={item} showSeller />
          ))}
        </div>
      )}
    </div>
  );
}

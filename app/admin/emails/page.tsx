import type { Metadata } from "next";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { getEmailCampaignMeta } from "@/actions/admin/email-campaigns";
import { EmailCampaignForm } from "@/components/admin/email-campaign-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Emails | Admin",
};

const TYPE_LABEL: Record<string, string> = {
  WELCOME: "Welcome",
  DROPOUT: "Cart dropout",
  OFFER: "Offer",
  FESTIVAL: "Festival",
};

export default async function AdminEmailsPage() {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/admin");
  }

  const meta = await getEmailCampaignMeta();
  if (!meta.success) {
    return <p className="text-sm text-red-700">{meta.error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Customer emails
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Super Admin can send welcome notes, cart reminders, offers and festival
          greetings straight to customers. New signups also receive a welcome
          mail automatically.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Customers" value={meta.data.customers} />
        <Stat label="Cart dropouts" value={meta.data.dropouts} />
        <Stat label="Never ordered" value={meta.data.neverOrdered} />
      </div>

      <EmailCampaignForm
        configured={meta.data.configured}
        customers={meta.data.customers}
        dropouts={meta.data.dropouts}
        neverOrdered={meta.data.neverOrdered}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent sends</CardTitle>
        </CardHeader>
        <CardContent>
          {meta.data.campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No campaigns sent yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">When</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Subject</th>
                    <th className="pb-2 font-medium">Delivered</th>
                  </tr>
                </thead>
                <tbody>
                  {meta.data.campaigns.map((row) => (
                    <tr key={row.id} className="border-t border-neutral-100">
                      <td className="py-2.5 pr-4 text-neutral-500">
                        {format(new Date(row.createdAt), "d MMM, h:mm a")}
                      </td>
                      <td className="py-2.5 pr-4">
                        {TYPE_LABEL[row.type] ?? row.type}
                      </td>
                      <td className="py-2.5 pr-4">{row.subject}</td>
                      <td className="py-2.5">
                        {row.sentCount}
                        {row.failCount ? ` · ${row.failCount} failed` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 font-serif text-3xl text-[#8b2e2e]">{value}</p>
    </div>
  );
}

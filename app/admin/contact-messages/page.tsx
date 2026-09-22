import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getContactMessages } from "@/actions/content/submit-contact";
import { ContactMessageActions } from "@/components/admin/contact-message-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Messages | Admin",
};

const TABS = [
  { id: "NEW", label: "New" },
  { id: "READ", label: "Read" },
  { id: "ARCHIVED", label: "Archived" },
  { id: "ALL", label: "All" },
] as const;

export default async function AdminContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status || "NEW").toUpperCase();
  const messages = await getContactMessages(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Contact messages
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Enquiries from the public contact form.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/contact-messages?status=${tab.id}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              status === tab.id
                ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]/40",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No messages in this view.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={msg.status === "NEW" ? "default" : "secondary"}
                      className={
                        msg.status === "NEW" ? "bg-[#8b2e2e]" : undefined
                      }
                    >
                      {msg.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.createdAt), "MMM d, yyyy · h:mm a")}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-brand">
                    {msg.subject}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {msg.name} ·{" "}
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-[#8b2e2e] underline"
                    >
                      {msg.email}
                    </a>
                    {msg.phone ? ` · ${msg.phone}` : ""}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                    {msg.message}
                  </p>
                </div>
                <ContactMessageActions
                  id={msg.id}
                  status={msg.status}
                  email={msg.email}
                  subject={msg.subject}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

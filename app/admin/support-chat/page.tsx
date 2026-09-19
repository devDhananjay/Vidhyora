import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  getAdminSupportThread,
  getAdminSupportThreads,
} from "@/actions/support/support-chat";
import {
  AdminSupportLiveThread,
  AdminSupportReplyForm,
  AdminSupportThreadLink,
} from "@/components/admin/support-chat-admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRODUCTS_ATTACHMENT_TYPE, isGuestThreadEmail } from "@/lib/support-chat/guide";

export const metadata: Metadata = {
  title: "Support Chat | Admin",
};

const TABS = [
  { id: "OPEN", label: "Open" },
  { id: "PENDING", label: "Pending" },
  { id: "CLOSED", label: "Closed" },
  { id: "ALL", label: "All" },
] as const;

export default async function AdminSupportChatPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status || "OPEN").toUpperCase();
  const threads = await getAdminSupportThreads(status);
  const activeId = params.id || threads[0]?.id;
  const active = activeId ? await getAdminSupportThread(activeId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Support chat
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Live conversations from the VIDYORA concierge widget.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={
              activeId
                ? `/admin/support-chat?status=${tab.id}&id=${activeId}`
                : `/admin/support-chat?status=${tab.id}`
            }
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

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-3">
          {threads.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No chats in this view.
              </CardContent>
            </Card>
          ) : (
            threads.map((thread) => {
              const preview = thread.messages[0];
              const isProducts =
                preview?.attachmentType === PRODUCTS_ATTACHMENT_TYPE;
              const previewText = isProducts
                ? "Product recommendations"
                : preview?.body ||
                  preview?.attachmentName ||
                  "Attachment";
              const guest = isGuestThreadEmail(thread.email);
              return (
                <AdminSupportThreadLink
                  key={thread.id}
                  id={thread.id}
                  status={status}
                  active={thread.id === active?.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900">
                        {guest
                          ? thread.name && thread.name !== "Guest"
                            ? thread.name
                            : "Guest shopper"
                          : thread.name}
                        {guest && thread.name && thread.name !== "Guest" ? (
                          <span className="ml-1.5 text-[10px] font-normal text-neutral-400">
                            Guest
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {guest
                          ? "Anonymous storefront chat"
                          : `${thread.email}${thread.phone ? ` · ${thread.phone}` : ""}`}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        thread.status === "OPEN"
                          ? "bg-[#8b2e2e] text-white"
                          : undefined
                      }
                    >
                      {thread.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                    {previewText}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {format(new Date(thread.lastMessageAt), "MMM d · h:mm a")} ·{" "}
                    {thread._count.messages} msgs
                  </p>
                </AdminSupportThreadLink>
              );
            })
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {!active ? (
              <p className="p-8 text-center text-muted-foreground">
                Select a conversation.
              </p>
            ) : (
              <div className="flex h-[min(70vh,720px)] flex-col">
                <div className="border-b border-neutral-100 px-5 py-4">
                  <p className="font-serif text-xl text-[#8b2e2e]">
                    {isGuestThreadEmail(active.email) &&
                    (!active.name || active.name === "Guest")
                      ? "Guest shopper"
                      : active.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isGuestThreadEmail(active.email)
                      ? "Anonymous storefront chat"
                      : `${active.email}${active.phone ? ` · ${active.phone}` : ""}`}
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </p>
                </div>
                <AdminSupportLiveThread
                  threadId={active.id}
                  initialMessages={active.messages}
                />
                <div className="border-t border-neutral-100 p-4">
                  <AdminSupportReplyForm threadId={active.id} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

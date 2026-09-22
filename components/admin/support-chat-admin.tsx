"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  replySupportChatAsAgent,
  updateSupportChatStatus,
} from "@/actions/support/support-chat";
import type { SupportChatMessageDto } from "@/lib/support-chat/types";
import { parseMessageProducts } from "@/lib/support-chat/types";
import { useSupportChatRealtime } from "@/lib/hooks/use-support-chat-realtime";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

export function AdminSupportReplyForm({
  threadId,
  threadStatus,
}: {
  threadId: string;
  threadStatus?: "OPEN" | "PENDING" | "CLOSED" | "ARCHIVED";
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isArchived = threadStatus === "ARCHIVED";

  if (isArchived) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This chat was disposed for inactivity and is in Archive. It will be
          permanently deleted after 72 hours unless you re-open it.
        </p>
        <StatusButton threadId={threadId} status="OPEN" label="Re-open chat" />
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await replySupportChatAsAgent({ threadId, body });
          if (!result.success) {
            setError(result.error || "Failed to send");
            return;
          }
          setBody("");
          router.refresh();
        });
      }}
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        placeholder="Reply as VIDYORA…"
        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#8b2e2e]"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-full bg-[#8b2e2e] hover:bg-[#7a2727]"
        >
          {pending ? "Sending…" : "Send reply"}
        </Button>
        <StatusButton threadId={threadId} status="CLOSED" label="Close chat" />
        <StatusButton threadId={threadId} status="OPEN" label="Re-open" />
      </div>
    </form>
  );
}

function StatusButton({
  threadId,
  status,
  label,
}: {
  threadId: string;
  status: "OPEN" | "PENDING" | "CLOSED" | "ARCHIVED";
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="rounded-full"
      onClick={() => {
        startTransition(async () => {
          await updateSupportChatStatus({ threadId, status });
          router.refresh();
        });
      }}
    >
      {label}
    </Button>
  );
}

export function AdminSupportThreadLink({
  id,
  active,
  status,
  children,
}: {
  id: string;
  active: boolean;
  status?: string;
  children: React.ReactNode;
}) {
  const href = status
    ? `/admin/support-chat?status=${status}&id=${id}`
    : `/admin/support-chat?id=${id}`;
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border p-4 transition",
        active
          ? "border-[#8b2e2e] bg-[#faf6f0]"
          : "border-neutral-200 bg-white hover:border-[#8b2e2e]/40",
      )}
    >
      {children}
    </Link>
  );
}

type InitialMessage = {
  id: string;
  sender: "CUSTOMER" | "AGENT" | "SYSTEM";
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  createdAt: Date | string;
};

export function AdminSupportLiveThread({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: InitialMessage[];
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<SupportChatMessageDto[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      attachmentType: m.attachmentType,
      createdAt:
        typeof m.createdAt === "string"
          ? m.createdAt
          : m.createdAt.toISOString(),
      products: parseMessageProducts(m.attachmentType, m.attachmentName),
    })),
  );

  useEffect(() => {
    setMessages(
      initialMessages.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        attachmentUrl: m.attachmentUrl,
        attachmentName: m.attachmentName,
        attachmentType: m.attachmentType,
        createdAt:
          typeof m.createdAt === "string"
            ? m.createdAt
            : m.createdAt.toISOString(),
        products: parseMessageProducts(m.attachmentType, m.attachmentName),
      })),
    );
    // Reset when switching conversations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useSupportChatRealtime({
    mode: "admin",
    onEvent: (event) => {
      if (event.type === "message" && event.threadId === threadId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [...prev, event.message];
        });
      }
      if (event.type === "thread" && event.threadId !== threadId) {
        router.refresh();
      }
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <div
      ref={listRef}
      className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#faf8f6] px-4 py-4"
    >
      {messages.map((message) => {
        const mine = message.sender === "AGENT";
        const customer = message.sender === "CUSTOMER";
        return (
          <div
            key={message.id}
            className={cn("flex", mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                mine
                  ? "bg-[#8b2e2e] text-white"
                  : customer
                    ? "bg-white text-neutral-800"
                    : "border border-dashed border-[#ead9c4] bg-[#fffdf9] text-neutral-600",
              )}
            >
              <p className="mb-1 text-[10px] uppercase opacity-70">
                {message.sender}
              </p>
              {message.body ? (
                <p className="whitespace-pre-wrap">{message.body}</p>
              ) : null}
              {message.products?.length ? (
                <div className="mt-2 space-y-1.5">
                  {message.products.map((product) => (
                    <a
                      key={product.id}
                      href={product.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex gap-2 rounded-lg p-1.5",
                        mine ? "bg-white/10" : "bg-[#faf8f6]",
                      )}
                    >
                      {product.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.thumbnail}
                          alt=""
                          className="size-12 rounded object-cover"
                        />
                      ) : (
                        <span className="size-12 rounded bg-[#ead9c4]/40" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[12px] font-medium">
                          {product.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] opacity-80">
                          {formatCurrency(product.price)}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}
              {message.attachmentUrl && !message.products?.length ? (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block underline"
                >
                  {message.attachmentName || "Attachment"}
                </a>
              ) : null}
              <p className="mt-1 text-[10px] opacity-60">
                {format(new Date(message.createdAt), "h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

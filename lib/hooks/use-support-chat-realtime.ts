"use client";

import { useEffect, useRef } from "react";
import type { SupportChatMessageDto } from "@/lib/support-chat/types";
import type { SupportChatRealtimeEvent } from "@/lib/support-chat/realtime-hub";

type CustomerOpts = {
  mode: "customer";
  threadId: string;
  guestToken: string;
  onMessage: (message: SupportChatMessageDto) => void;
  enabled?: boolean;
};

type AdminOpts = {
  mode: "admin";
  onEvent: (event: SupportChatRealtimeEvent) => void;
  enabled?: boolean;
};

export function useSupportChatRealtime(opts: CustomerOpts | AdminOpts) {
  const onMessageRef = useRef<CustomerOpts["onMessage"] | null>(null);
  const onEventRef = useRef<AdminOpts["onEvent"] | null>(null);

  if (opts.mode === "customer") {
    onMessageRef.current = opts.onMessage;
  } else {
    onEventRef.current = opts.onEvent;
  }

  const enabled = opts.enabled !== false;
  const threadId = opts.mode === "customer" ? opts.threadId : "";
  const guestToken = opts.mode === "customer" ? opts.guestToken : "";
  const mode = opts.mode;

  useEffect(() => {
    if (!enabled) return;
    if (mode === "customer" && (!threadId || !guestToken)) return;

    const url =
      mode === "admin"
        ? "/api/support-chat/events?mode=admin"
        : `/api/support-chat/events?threadId=${encodeURIComponent(threadId)}&guestToken=${encodeURIComponent(guestToken)}`;

    let closed = false;
    let retryMs = 1000;
    let source: EventSource | null = null;
    let retryTimer: number | null = null;

    const connect = () => {
      if (closed) return;
      source = new EventSource(url);

      source.onmessage = (event) => {
        retryMs = 1000;
        try {
          const payload = JSON.parse(event.data) as SupportChatRealtimeEvent;
          if (mode === "customer") {
            if (payload.type === "message") {
              onMessageRef.current?.(payload.message);
            }
          } else {
            onEventRef.current?.(payload);
          }
        } catch {
          /* ignore malformed */
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (closed) return;
        retryTimer = window.setTimeout(() => {
          retryMs = Math.min(retryMs * 1.5, 8000);
          connect();
        }, retryMs);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer != null) window.clearTimeout(retryTimer);
      source?.close();
    };
  }, [enabled, mode, threadId, guestToken]);
}

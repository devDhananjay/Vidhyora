import { EventEmitter } from "node:events";
import type { SupportChatMessageDto } from "@/lib/support-chat/types";

export type SupportChatRealtimeEvent =
  | {
      type: "message";
      threadId: string;
      message: SupportChatMessageDto;
    }
  | {
      type: "thread";
      threadId: string;
      status?: string;
    };

declare global {
  // eslint-disable-next-line no-var
  var __vidyoraSupportChatHub: EventEmitter | undefined;
}

function getHub() {
  if (!globalThis.__vidyoraSupportChatHub) {
    const hub = new EventEmitter();
    hub.setMaxListeners(200);
    globalThis.__vidyoraSupportChatHub = hub;
  }
  return globalThis.__vidyoraSupportChatHub;
}

export function publishSupportChatEvent(event: SupportChatRealtimeEvent) {
  getHub().emit("event", event);
  getHub().emit(`thread:${event.threadId}`, event);
}

export function subscribeSupportChat(
  threadId: string | "admin",
  listener: (event: SupportChatRealtimeEvent) => void,
) {
  const hub = getHub();
  const onEvent = (event: SupportChatRealtimeEvent) => {
    if (threadId === "admin" || event.threadId === threadId) {
      listener(event);
    }
  };
  hub.on("event", onEvent);
  return () => {
    hub.off("event", onEvent);
  };
}

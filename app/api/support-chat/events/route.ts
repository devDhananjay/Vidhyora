import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/roles";
import {
  subscribeSupportChat,
  type SupportChatRealtimeEvent,
} from "@/lib/support-chat/realtime-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseEncode(event: SupportChatRealtimeEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const threadId = searchParams.get("threadId")?.trim() || "";
  const guestToken = searchParams.get("guestToken")?.trim() || "";

  let room: string | null = null;

  if (mode === "admin") {
    const session = await auth();
    if (!session?.user?.id || !isPlatformAdmin(session.user.role)) {
      return new Response("Unauthorized", { status: 401 });
    }
    room = "admin";
  } else {
    if (!threadId || !guestToken) {
      return new Response("Missing thread credentials", { status: 400 });
    }
    const thread = await prisma.supportChatThread.findFirst({
      where: { id: threadId, guestToken },
      select: { id: true },
    });
    if (!thread) {
      return new Response("Chat not found", { status: 404 });
    }
    room = threadId;
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: SupportChatRealtimeEvent) => {
        try {
          controller.enqueue(encoder.encode(sseEncode(event)));
        } catch {
          /* closed */
        }
      };

      controller.enqueue(encoder.encode(`event: ready\ndata: ok\n\n`));
      unsubscribe = subscribeSupportChat(room!, send);
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

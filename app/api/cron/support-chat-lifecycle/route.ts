import { NextResponse } from "next/server";
import { maintainSupportChatLifecycle } from "@/lib/support-chat/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return {
      ok: false as const,
      status: 503,
      error: "CRON_SECRET is not configured",
    };
  }
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const querySecret = new URL(request.url).searchParams.get("secret") || "";
  if (bearer !== secret && querySecret !== secret) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  return { ok: true as const };
}

/**
 * Dispose inactive live chats (30m) → Archive, then purge Archive after 72h.
 *
 * Schedule every 5–10 minutes:
 *   GET/POST /api/cron/support-chat-lifecycle
 *   Authorization: Bearer $CRON_SECRET
 */
async function run(request: Request) {
  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await maintainSupportChatLifecycle();
    return NextResponse.json({
      ok: true,
      archived: result.archived,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error("support-chat lifecycle cron failed:", error);
    return NextResponse.json(
      { error: "Support chat lifecycle failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

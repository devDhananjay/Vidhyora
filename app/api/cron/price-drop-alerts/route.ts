import { NextResponse } from "next/server";
import { processPriceDropAlerts } from "@/lib/email/product-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false as const, status: 503, error: "CRON_SECRET is not configured" };
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
 * Price-drop alert job — honors UserNotificationPreference.priceDrops.
 * Schedule: GET/POST /api/cron/price-drop-alerts with Authorization: Bearer $CRON_SECRET
 */
async function run(request: Request) {
  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await processPriceDropAlerts({ limit: 500 });
    return NextResponse.json({
      ok: true,
      job: "price-drop-alerts",
      ...result,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("price-drop cron failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Job failed" },
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

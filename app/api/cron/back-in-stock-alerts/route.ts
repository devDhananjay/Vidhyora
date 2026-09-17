import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyBackInStockIfNeeded } from "@/lib/email/product-alerts";

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
 * Back-in-stock catch-up job — finds active BIS alerts for products that are
 * currently available and notifies (honors productBackInStock prefs).
 * Use when stock was updated outside seller inventory hooks.
 *
 * Schedule: GET/POST /api/cron/back-in-stock-alerts with Authorization: Bearer $CRON_SECRET
 */
async function run(request: Request) {
  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const alerts = await prisma.productAlert.findMany({
      where: { type: "BACK_IN_STOCK", active: true },
      select: {
        id: true,
        productId: true,
        variantId: true,
        product: {
          select: {
            name: true,
            slug: true,
            status: true,
            approvalStatus: true,
            variants: {
              where: { isActive: true },
              select: { id: true, stock: true, reservedStock: true },
            },
          },
        },
      },
      take: 300,
      orderBy: { createdAt: "asc" },
    });

    let notifiedJobs = 0;

    for (const alert of alerts) {
      const product = alert.product;
      if (
        !product ||
        product.status !== "ACTIVE" ||
        product.approvalStatus !== "APPROVED"
      ) {
        continue;
      }

      const candidates = alert.variantId
        ? product.variants.filter((v) => v.id === alert.variantId)
        : product.variants;

      const inStock = candidates.find((v) => v.stock - v.reservedStock > 0);
      if (!inStock) continue;

      await notifyBackInStockIfNeeded({
        productId: alert.productId,
        variantId: inStock.id,
        previousAvailable: 0,
        nextAvailable: inStock.stock - inStock.reservedStock,
        productName: product.name,
        productSlug: product.slug,
      });
      notifiedJobs += 1;
    }

    return NextResponse.json({
      ok: true,
      job: "back-in-stock-alerts",
      scanned: alerts.length,
      triggered: notifiedJobs,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("back-in-stock cron failed:", error);
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

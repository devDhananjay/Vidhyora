"use server";

import type { EmailCampaignType, Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { renderCampaignEmail } from "@/lib/email/campaign-templates";
import { toAbsoluteEmailUrl } from "@/lib/email/app-url";
import {
  campaignAudienceSchema,
  sendEmailCampaignSchema,
  type SendEmailCampaignInput,
} from "@/lib/validations/email-campaign";

const MAX_RECIPIENTS = 250;
const DROPOUT_AFTER_MS = 2 * 60 * 60 * 1000;
const NEVER_ORDERED_AFTER_MS = 24 * 60 * 60 * 1000;

type Recipient = {
  email: string;
  name: string;
  leftBehind?: string[];
};

function parseCustomEmails(raw?: string) {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)),
    ),
  ];
}

async function resolveAudience(
  audience: SendEmailCampaignInput["audience"],
  customEmails: string,
  testerEmail?: string,
): Promise<Recipient[]> {
  if (audience === "TEST") {
    if (!testerEmail) return [];
    const me = await prisma.user.findUnique({
      where: { email: testerEmail.toLowerCase() },
      select: { email: true, name: true },
    });
    return [
      {
        email: testerEmail,
        name: me?.name || "VIDYORA",
        leftBehind: ["Diamond solitaire ring", "Temple gold necklace"],
      },
    ];
  }

  if (audience === "CUSTOM_EMAILS") {
    const emails = parseCustomEmails(customEmails);
    if (emails.length === 0) return [];
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true, name: true },
    });
    const byEmail = new Map(users.map((user) => [user.email, user.name]));
    return emails.map((email) => ({
      email,
      name: byEmail.get(email) || "there",
    }));
  }

  if (audience === "CART_DROPOUT") {
    const cutoff = new Date(Date.now() - DROPOUT_AFTER_MS);
    const carts = await prisma.cart.findMany({
      where: {
        userId: { not: null },
        updatedAt: { lte: cutoff },
        user: {
          isActive: true,
          role: "CUSTOMER",
          OR: [
            { notificationPreference: null },
            { notificationPreference: { promotions: true } },
          ],
        },
        items: { some: { savedForLater: false } },
      },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          where: { savedForLater: false },
          take: 3,
          include: { product: { select: { name: true } } },
        },
      },
      take: MAX_RECIPIENTS,
      orderBy: { updatedAt: "desc" },
    });

    return carts
      .filter((cart) => cart.user?.email)
      .map((cart) => ({
        email: cart.user!.email,
        name: cart.user!.name || "there",
        leftBehind: cart.items.map((item) => item.product.name),
      }));
  }

  const where: Prisma.UserWhereInput = {
    isActive: true,
    email: { not: "" },
  };

  if (audience === "ALL_CUSTOMERS") {
    where.role = "CUSTOMER";
    where.OR = [
      { notificationPreference: null },
      { notificationPreference: { promotions: true } },
    ];
  }
  if (audience === "ALL_SELLERS") where.role = "SELLER";
  if (audience === "NEVER_ORDERED") {
    where.role = "CUSTOMER";
    where.orders = { none: {} };
    where.createdAt = { lte: new Date(Date.now() - NEVER_ORDERED_AFTER_MS) };
    where.OR = [
      { notificationPreference: null },
      { notificationPreference: { promotions: true } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: { email: true, name: true },
    take: MAX_RECIPIENTS,
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    email: user.email,
    name: user.name || "there",
  }));
}

export async function getEmailCampaignMeta(): Promise<
  ActionResult<{
    configured: boolean;
    customers: number;
    dropouts: number;
    neverOrdered: number;
    campaigns: Array<{
      id: string;
      type: EmailCampaignType;
      audience: string;
      subject: string;
      sentCount: number;
      failCount: number;
      createdAt: string;
    }>;
  }>
> {
  await requireSuperAdmin();
  const [customers, dropouts, neverOrdered, campaigns] = await Promise.all([
    prisma.user.count({ where: { isActive: true, role: "CUSTOMER" } }),
    resolveAudience("CART_DROPOUT", "").then((rows) => rows.length),
    resolveAudience("NEVER_ORDERED", "").then((rows) => rows.length),
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        type: true,
        audience: true,
        subject: true,
        sentCount: true,
        failCount: true,
        createdAt: true,
      },
    }),
  ]);

  return actionSuccess({
    configured: isEmailConfigured(),
    customers,
    dropouts,
    neverOrdered,
    campaigns: campaigns.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function previewCampaignAudience(
  audience: string,
  customEmails?: string,
): Promise<ActionResult<{ count: number }>> {
  const session = await requireSuperAdmin();
  const parsed = campaignAudienceSchema.safeParse(audience);
  if (!parsed.success) return actionError("Choose a valid audience");
  const recipients = await resolveAudience(
    parsed.data,
    customEmails || "",
    session.user.email,
  );
  return actionSuccess({ count: recipients.length });
}

export async function sendEmailCampaign(
  data: unknown,
): Promise<ActionResult<{ sent: number; failed: number; skipped: number }>> {
  const session = await requireSuperAdmin();
  const parsed = sendEmailCampaignSchema.safeParse(data);
  if (!parsed.success) {
    return actionError("Please check the campaign fields and try again");
  }

  if (!isEmailConfigured() && parsed.data.audience !== "TEST") {
    // Test in development may still log; production needs SMTP.
    if (process.env.NODE_ENV === "production") {
      return actionError(
        "SMTP is not configured. Add EMAIL_SERVER and EMAIL_FROM, then restart the app.",
      );
    }
  }

  const recipients = await resolveAudience(
    parsed.data.audience,
    parsed.data.customEmails || "",
    session.user.email,
  );

  if (recipients.length === 0) {
    return actionError("No recipients matched this audience.");
  }

  const ctaUrl = toAbsoluteEmailUrl(parsed.data.ctaUrl);
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      const html = renderCampaignEmail({
        type: parsed.data.type,
        name: recipient.name,
        headline: parsed.data.headline,
        body: parsed.data.body,
        ctaLabel: parsed.data.ctaLabel,
        ctaUrl,
        couponCode: parsed.data.couponCode || undefined,
        eyebrow: parsed.data.eyebrow || undefined,
        footnote: parsed.data.footnote || undefined,
        leftBehind:
          parsed.data.type === "DROPOUT" ? recipient.leftBehind : undefined,
        heroImage: parsed.data.heroImage || undefined,
        heroAlt: parsed.data.heroAlt || undefined,
      });
      await sendEmail({
        to: { email: recipient.email, name: recipient.name },
        subject: parsed.data.subject,
        html,
        text: `${parsed.data.headline}\n\n${parsed.data.body}\n\n${ctaUrl}`,
      });
      sent += 1;
    } catch (error) {
      console.error("Campaign email failed:", recipient.email, error);
      failed += 1;
    }
  }

  await prisma.emailCampaign.create({
    data: {
      type: parsed.data.type,
      audience: parsed.data.audience,
      subject: parsed.data.subject,
      headline: parsed.data.headline,
      body: parsed.data.body,
      ctaLabel: parsed.data.ctaLabel,
      ctaUrl,
      couponCode: parsed.data.couponCode || null,
      sentCount: sent,
      failCount: failed,
      sentById: session.user.id,
    },
  });

  if (sent === 0) {
    return actionError(
      failed > 0
        ? "Could not send any emails. Check SMTP settings."
        : "Nothing was sent.",
    );
  }

  return actionSuccess({
    sent,
    failed,
    skipped: Math.max(0, recipients.length - sent - failed),
  });
}

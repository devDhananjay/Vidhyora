"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/content/get-site-settings";
import { whatsappHref } from "@/lib/content/site-settings-defaults";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/email/app-url";
import { wrapBrandEmail } from "@/lib/email/brand-layout";
import { getEmailAppUrl } from "@/lib/email/app-url";
import { uploadFile } from "@/lib/storage";
import { type ActionResult } from "@/lib/utils";
import {
  getRequestIp,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import { publishSupportChatEvent } from "@/lib/support-chat/realtime-hub";
import {
  GUIDE_CATEGORIES,
  GUIDE_OCCASIONS,
  PRODUCTS_ATTACHMENT_TYPE,
  isGuestThreadEmail,
  mergeGuideFilters,
  shopHrefForGuide,
  type GuideCategoryId,
  type GuideOccasionId,
} from "@/lib/support-chat/guide";
import {
  parseMessageProducts,
  type SupportChatMessageDto,
  type SupportChatProductCard,
  type SupportChatThreadDto,
} from "@/lib/support-chat/types";
import { productSearch } from "@/lib/search/product-search";

export type {
  SupportChatMessageDto,
  SupportChatProductCard,
  SupportChatThreadDto,
};

const sendSchema = z.object({
  threadId: z.string().min(1),
  guestToken: z.string().min(1),
  body: z.string().trim().max(4000).optional().or(z.literal("")),
  attachmentUrl: z.string().max(500).optional().or(z.literal("")),
  attachmentName: z.string().max(200).optional().or(z.literal("")),
  attachmentType: z.string().max(100).optional().or(z.literal("")),
  /** Guided chip picks — skip FAQ / “specialist will reply” noise. */
  skipAutoReply: z.boolean().optional(),
  /** Optional agent line after a guided customer choice. */
  agentFollowUp: z.string().trim().max(1000).optional(),
});

const guideSchema = z.object({
  threadId: z.string().min(1),
  guestToken: z.string().min(1),
  categoryId: z
    .enum([
      "rings",
      "earrings",
      "necklaces",
      "gifting",
      "help-choose",
      "other",
      "type",
    ])
    .nullable(),
  occasionId: z
    .enum(["everyday", "party", "wedding", "gift", "budget"])
    .nullable(),
  offset: z.number().int().min(0).max(90).optional(),
  query: z.string().trim().max(200).optional().or(z.literal("")),
});

function mapMessage(m: {
  id: string;
  sender: "CUSTOMER" | "AGENT" | "SYSTEM";
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  createdAt: Date;
}): SupportChatMessageDto {
  const products = parseMessageProducts(m.attachmentType, m.attachmentName);
  return {
    id: m.id,
    sender: m.sender,
    body: m.body,
    attachmentUrl: products ? null : m.attachmentUrl,
    attachmentName: products ? null : m.attachmentName,
    attachmentType: products ? null : m.attachmentType,
    createdAt: m.createdAt.toISOString(),
    products,
  };
}

function mapThread(
  thread: {
    id: string;
    guestToken: string;
    userId: string | null;
    name: string;
    email: string;
    phone: string | null;
    status: "OPEN" | "PENDING" | "CLOSED";
    messages: Array<{
      id: string;
      sender: "CUSTOMER" | "AGENT" | "SYSTEM";
      body: string | null;
      attachmentUrl: string | null;
      attachmentName: string | null;
      attachmentType: string | null;
      createdAt: Date;
    }>;
  },
  whatsappUrl: string,
): SupportChatThreadDto {
  return {
    id: thread.id,
    guestToken: thread.guestToken,
    name: thread.name,
    email: thread.email,
    phone: thread.phone,
    status: thread.status,
    whatsappUrl,
    isGuest: !thread.userId || isGuestThreadEmail(thread.email),
    messages: thread.messages.map(mapMessage),
  };
}

async function assertThreadAccess(threadId: string, guestToken: string) {
  const thread = await prisma.supportChatThread.findFirst({
    where: { id: threadId, guestToken },
  });
  return thread;
}

async function notifySupportNewThread(options: {
  threadId: string;
  name: string;
  email: string;
  phone: string;
}) {
  try {
    const settings = await getSiteSettings();
    const supportEmail = settings.contact.supportEmail;
    if (!supportEmail) return;
    const adminUrl = `${getEmailAppUrl()}/admin/support-chat?id=${options.threadId}`;
    await sendEmail({
      to: { email: supportEmail, name: "VIDYORA Support" },
      subject: `[Chat] New conversation — ${options.name}`,
      html: wrapBrandEmail({
        preheader: `${options.name} started a chat on VIDYORA.`,
        eyebrow: "Support chat",
        title: "New chat started",
        bodyHtml: `<p style="margin:0 0 12px;"><strong>${escapeHtml(options.name)}</strong> (${escapeHtml(options.email)}${options.phone ? ` · ${escapeHtml(options.phone)}` : ""}) just started a live chat.</p>`,
        cta: { label: "Open in admin", url: adminUrl },
      }),
      text: `New chat from ${options.name} <${options.email}>. Open ${adminUrl}`,
    });
  } catch (error) {
    console.error("[support-chat] notify thread failed", error);
  }
}

async function notifySupportNewMessage(options: {
  threadId: string;
  name: string;
  preview: string;
}) {
  try {
    const settings = await getSiteSettings();
    const supportEmail = settings.contact.supportEmail;
    if (!supportEmail) return;
    const adminUrl = `${getEmailAppUrl()}/admin/support-chat?id=${options.threadId}`;
    await sendEmail({
      to: { email: supportEmail, name: "VIDYORA Support" },
      subject: `[Chat] Message from ${options.name}`,
      html: `<p><strong>${escapeHtml(options.name)}</strong> wrote:</p><p>${escapeHtml(options.preview)}</p><p><a href="${adminUrl}">Reply in admin</a></p>`,
      text: `${options.name}: ${options.preview}\n${adminUrl}`,
    });
  } catch (error) {
    console.error("[support-chat] notify message failed", error);
  }
}

async function findFaqReply(query: string): Promise<string | null> {
  const q = query.trim();
  if (q.length < 3) return null;
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
  if (words.length === 0) return null;

  const article = await prisma.helpArticle.findFirst({
    where: {
      isActive: true,
      OR: words.flatMap((word) => [
        { question: { contains: word, mode: "insensitive" as const } },
        { answer: { contains: word, mode: "insensitive" as const } },
      ]),
    },
    orderBy: { sortOrder: "asc" },
  });

  if (!article) return null;
  return `${article.question}\n\n${article.answer}`;
}

export async function startSupportChat(): Promise<
  ActionResult<SupportChatThreadDto>
> {
  try {
    const ip = await getRequestIp();
    const limited = rateLimit(`support-chat-start:${ip}`, 8, 60_000);
    if (!limited.ok) {
      return { success: false, error: rateLimitMessage(limited.retryAfterSec) };
    }

    const session = await auth();
    const settings = await getSiteSettings();
    const wa = whatsappHref(settings.contact.whatsappNumber);
    const guestToken = crypto.randomUUID();

    let name = "Guest";
    let email = `guest+${guestToken.slice(0, 8)}@guest.vidyora`;
    let phone: string | null = null;
    let userId: string | null = null;

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, phone: true },
      });
      if (user) {
        userId = user.id;
        name = user.name?.trim() || "Customer";
        email = user.email;
        phone = user.phone;
      }
    }

    const firstName = name.split(/\s+/)[0] || name;
    const welcomeBody = userId
      ? `Hi ${firstName}! Welcome back to VIDYORA 💛\nHow can I help you today?`
      : `Hi! Welcome to VIDYORA 💛\nHow can I help you today?`;

    const thread = await prisma.supportChatThread.create({
      data: {
        guestToken,
        userId,
        name,
        email,
        phone,
        status: "OPEN",
        messages: {
          create: [
            { sender: "AGENT", body: welcomeBody },
            {
              sender: "SYSTEM",
              body: "Pick a category below, or type what you’re looking for.",
            },
          ],
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    void notifySupportNewThread({
      threadId: thread.id,
      name: thread.name,
      email: thread.email,
      phone: thread.phone || "",
    });

    publishSupportChatEvent({
      type: "thread",
      threadId: thread.id,
      status: thread.status,
    });
    for (const message of thread.messages) {
      publishSupportChatEvent({
        type: "message",
        threadId: thread.id,
        message: mapMessage(message),
      });
    }

    return {
      success: true,
      data: mapThread(thread, wa),
    };
  } catch (error) {
    console.error("startSupportChat error:", error);
    return { success: false, error: "Could not start chat. Please try again." };
  }
}

async function fetchGuideProducts(options: {
  categoryId: GuideCategoryId | null;
  occasionId: GuideOccasionId | null;
  offset?: number;
  query?: string;
}): Promise<SupportChatProductCard[]> {
  const filters = mergeGuideFilters(options.categoryId, options.occasionId);
  const offset = Math.max(0, options.offset ?? 0);
  const pageSize = 3;
  const page = Math.floor(offset / pageSize) + 1;
  const q = options.query?.trim() || "";
  const { items } = await productSearch.search(q, filters, page, pageSize);
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    thumbnail: item.thumbnail || item.images[0]?.url || null,
    price: item.basePrice,
    href: `/products/${item.slug}`,
  }));
}

/**
 * Guided shopping step: after category + occasion, recommend products.
 */
export async function recommendSupportChatProducts(
  raw: z.infer<typeof guideSchema>,
): Promise<
  ActionResult<{
    messages: SupportChatMessageDto[];
    products: SupportChatProductCard[];
  }>
> {
  try {
    const parsed = guideSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: "Invalid guide choice" };
    }

    const thread = await assertThreadAccess(
      parsed.data.threadId,
      parsed.data.guestToken,
    );
    if (!thread) {
      return { success: false, error: "Chat session expired. Please start again." };
    }

    const category = GUIDE_CATEGORIES.find(
      (c) => c.id === parsed.data.categoryId,
    );
    const occasion = GUIDE_OCCASIONS.find(
      (o) => o.id === parsed.data.occasionId,
    );
    const products = await fetchGuideProducts({
      categoryId: parsed.data.categoryId,
      occasionId: parsed.data.occasionId,
      offset: parsed.data.offset ?? 0,
      query: parsed.data.query || "",
    });

    const labelBits = [category?.label, occasion?.label]
      .filter(Boolean)
      .join(" · ");
    const shopHref = shopHrefForGuide(
      parsed.data.categoryId,
      parsed.data.occasionId,
    );
    const offset = parsed.data.offset ?? 0;
    let body: string;
    if (products.length > 0) {
      body =
        offset > 0
          ? `Here are more options${labelBits ? ` for ${labelBits}` : ""}:`
          : `Based on your preference${labelBits ? ` (${labelBits})` : ""}, here are some pieces you may love:\n\nWant more options?`;
    } else if (offset > 0) {
      body = `That's all I have for this preference right now. Browse the full collection: ${shopHref} — or tap Change Preference.`;
    } else {
      body = `I couldn’t find exact matches right now. Browse our collection: ${shopHref} — or tell me more about what you like (metal, budget, style).`;
    }

    const agentMsg = await prisma.supportChatMessage.create({
      data: {
        threadId: thread.id,
        sender: "AGENT",
        body,
        attachmentType: products.length ? PRODUCTS_ATTACHMENT_TYPE : null,
        attachmentName: products.length ? JSON.stringify(products) : null,
      },
    });

    await prisma.supportChatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });

    const mapped = mapMessage(agentMsg);
    publishSupportChatEvent({
      type: "message",
      threadId: thread.id,
      message: mapped,
    });

    return {
      success: true,
      data: {
        messages: [mapped],
        products,
      },
    };
  } catch (error) {
    console.error("recommendSupportChatProducts error:", error);
    return { success: false, error: "Could not load recommendations." };
  }
}

export async function sendSupportChatMessage(
  raw: z.infer<typeof sendSchema>,
): Promise<ActionResult<{ messages: SupportChatMessageDto[] }>> {
  try {
    const ip = await getRequestIp();
    const limited = rateLimit(`support-chat-send:${ip}`, 30, 60_000);
    if (!limited.ok) {
      return { success: false, error: rateLimitMessage(limited.retryAfterSec) };
    }

    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid message",
      };
    }

    const body = parsed.data.body?.trim() || "";
    const attachmentUrl = parsed.data.attachmentUrl?.trim() || "";
    if (
      attachmentUrl &&
      !attachmentUrl.startsWith("/uploads/support-chat/")
    ) {
      return { success: false, error: "Invalid attachment" };
    }
    if (!body && !attachmentUrl) {
      return { success: false, error: "Type a message or attach a file" };
    }

    const thread = await assertThreadAccess(
      parsed.data.threadId,
      parsed.data.guestToken,
    );
    if (!thread) {
      return { success: false, error: "Chat session expired. Please start again." };
    }
    if (thread.status === "CLOSED") {
      return { success: false, error: "This chat is closed." };
    }

    const created = await prisma.supportChatMessage.create({
      data: {
        threadId: thread.id,
        sender: "CUSTOMER",
        body: body || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: parsed.data.attachmentName?.trim() || null,
        attachmentType: parsed.data.attachmentType?.trim() || null,
      },
    });
    publishSupportChatEvent({
      type: "message",
      threadId: thread.id,
      message: mapMessage(created),
    });

    if (body && !parsed.data.skipAutoReply) {
      const lower = body.toLowerCase();
      let autoReply: string | null = null;

      if (/whatsapp/.test(lower)) {
        const settings = await getSiteSettings();
        const wa = whatsappHref(settings.contact.whatsappNumber);
        autoReply = `You can reach us on WhatsApp here: ${wa}`;
      } else if (/track|order status|my order/.test(lower)) {
        autoReply =
          "You can track orders anytime from My Orders (sign in if needed): https://vidyora.co.in/orders — share your order number here if you want us to check manually.";
      } else if (/store|store locator|nearby|visit/.test(lower)) {
        autoReply =
          "Find a VIDYORA store near you: https://vidyora.co.in/store-locator — or tell us your city and we'll help.";
      } else if (/ship|return|refund|exchange/.test(lower)) {
        autoReply =
          (await findFaqReply(body)) ||
          "Our shipping & returns help is here: https://vidyora.co.in/help — ask a specific question and I'll try to answer.";
      } else {
        autoReply = await findFaqReply(body);
      }

      if (autoReply) {
        const agentMsg = await prisma.supportChatMessage.create({
          data: {
            threadId: thread.id,
            sender: "AGENT",
            body: autoReply,
          },
        });
        publishSupportChatEvent({
          type: "message",
          threadId: thread.id,
          message: mapMessage(agentMsg),
        });
        const systemMsg = await prisma.supportChatMessage.create({
          data: {
            threadId: thread.id,
            sender: "SYSTEM",
            body: "If this didn't fully answer you, our team will follow up shortly — or keep chatting here.",
          },
        });
        publishSupportChatEvent({
          type: "message",
          threadId: thread.id,
          message: mapMessage(systemMsg),
        });
      } else {
        const systemMsg = await prisma.supportChatMessage.create({
          data: {
            threadId: thread.id,
            sender: "SYSTEM",
            body: "Thanks — a VIDYORA specialist will reply soon. You can keep sending details, files, or screenshots.",
          },
        });
        publishSupportChatEvent({
          type: "message",
          threadId: thread.id,
          message: mapMessage(systemMsg),
        });
      }
    } else if (attachmentUrl && !parsed.data.skipAutoReply) {
      const systemMsg = await prisma.supportChatMessage.create({
        data: {
          threadId: thread.id,
          sender: "SYSTEM",
          body: "Got your attachment. Our team will review it shortly.",
        },
      });
      publishSupportChatEvent({
        type: "message",
        threadId: thread.id,
        message: mapMessage(systemMsg),
      });
    }

    const followUp = parsed.data.agentFollowUp?.trim();
    if (followUp) {
      const agentMsg = await prisma.supportChatMessage.create({
        data: {
          threadId: thread.id,
          sender: "AGENT",
          body: followUp,
        },
      });
      publishSupportChatEvent({
        type: "message",
        threadId: thread.id,
        message: mapMessage(agentMsg),
      });
    }

    await prisma.supportChatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date(), status: "OPEN" },
    });
    publishSupportChatEvent({
      type: "thread",
      threadId: thread.id,
      status: "OPEN",
    });

    void (parsed.data.skipAutoReply
      ? Promise.resolve()
      : notifySupportNewMessage({
          threadId: thread.id,
          name: thread.name,
          preview: body || parsed.data.attachmentName || "Attachment",
        }));

    const messages = await prisma.supportChatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
    });

    revalidatePath("/admin/support-chat");
    return { success: true, data: { messages: messages.map(mapMessage) } };
  } catch (error) {
    console.error("sendSupportChatMessage error:", error);
    return { success: false, error: "Failed to send. Please try again." };
  }
}

export async function getSupportChatThread(options: {
  threadId: string;
  guestToken: string;
}): Promise<ActionResult<SupportChatThreadDto>> {
  try {
    const thread = await prisma.supportChatThread.findFirst({
      where: { id: options.threadId, guestToken: options.guestToken },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!thread) {
      return { success: false, error: "Chat not found" };
    }
    const settings = await getSiteSettings();
    return {
      success: true,
      data: mapThread(thread, whatsappHref(settings.contact.whatsappNumber)),
    };
  } catch (error) {
    console.error("getSupportChatThread error:", error);
    return { success: false, error: "Failed to load chat" };
  }
}

export async function uploadSupportChatFile(
  formData: FormData,
): Promise<
  ActionResult<{ url: string; name: string; type: string; size: number }>
> {
  try {
    const ip = await getRequestIp();
    const limited = rateLimit(`support-chat-upload:${ip}`, 20, 60_000);
    if (!limited.ok) {
      return { success: false, error: rateLimitMessage(limited.retryAfterSec) };
    }

    const threadId = String(formData.get("threadId") || "");
    const guestToken = String(formData.get("guestToken") || "");
    if (!threadId || !guestToken) {
      return { success: false, error: "Start a chat before uploading" };
    }
    const thread = await assertThreadAccess(threadId, guestToken);
    if (!thread) {
      return { success: false, error: "Chat session expired" };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a file" };
    }

    const uploaded = await uploadFile(file, {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ],
      folder: `uploads/support-chat/${thread.id}`,
    });

    return {
      success: true,
      data: {
        url: uploaded.url,
        name: uploaded.name,
        type: uploaded.type,
        size: uploaded.size,
      },
    };
  } catch (error) {
    console.error("uploadSupportChatFile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/** Public bootstrap for the storefront chat widget. */
export async function getSupportChatBootstrap(): Promise<{
  whatsappUrl: string;
  isLoggedIn: boolean;
}> {
  const [settings, session] = await Promise.all([getSiteSettings(), auth()]);
  return {
    whatsappUrl: whatsappHref(settings.contact.whatsappNumber),
    isLoggedIn: Boolean(session?.user?.id),
  };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminSupportThreads(status?: string) {
  try {
    await requireAdmin();
    const statusFilter =
      status && status !== "ALL"
        ? (status.toUpperCase() as "OPEN" | "PENDING" | "CLOSED")
        : undefined;
    return prisma.supportChatThread.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });
  } catch (error) {
    console.error("getAdminSupportThreads error:", error);
    return [];
  }
}

export async function getAdminSupportThread(id: string) {
  try {
    await requireAdmin();
    return prisma.supportChatThread.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  } catch (error) {
    console.error("getAdminSupportThread error:", error);
    return null;
  }
}

export async function replySupportChatAsAgent(options: {
  threadId: string;
  body: string;
}): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const body = options.body.trim();
    if (body.length < 1) {
      return { success: false, error: "Message required" };
    }

    const thread = await prisma.supportChatThread.findUnique({
      where: { id: options.threadId },
    });
    if (!thread) return { success: false, error: "Thread not found" };

    const agentMsg = await prisma.supportChatMessage.create({
      data: {
        threadId: thread.id,
        sender: "AGENT",
        body,
      },
    });
    publishSupportChatEvent({
      type: "message",
      threadId: thread.id,
      message: mapMessage(agentMsg),
    });
    await prisma.supportChatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date(), status: "PENDING" },
    });
    publishSupportChatEvent({
      type: "thread",
      threadId: thread.id,
      status: "PENDING",
    });

    try {
      if (!isGuestThreadEmail(thread.email)) {
        await sendEmail({
          to: { email: thread.email, name: thread.name },
          subject: "VIDYORA replied to your chat",
          html: wrapBrandEmail({
            preheader: "You have a new reply from VIDYORA.",
            eyebrow: "Support chat",
            title: "New reply from VIDYORA",
            bodyHtml: `<p style="margin:0 0 12px;">Dear ${escapeHtml(thread.name.split(/\s+/)[0] || thread.name)},</p>
            <p style="margin:0 0 12px;">${escapeHtml(body).replace(/\n/g, "<br/>")}</p>
            <p style="margin:0;font-size:13px;color:#7a6a64;">Open the chat widget on vidyora.co.in to continue the conversation.</p>`,
          }),
          text: `Hi ${thread.name},\n\n${body}\n\n— VIDYORA`,
        });
      }
    } catch (emailError) {
      console.error("[support-chat] customer reply email failed", emailError);
    }

    revalidatePath("/admin/support-chat");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("replySupportChatAsAgent error:", error);
    return { success: false, error: "Failed to reply" };
  }
}

export async function updateSupportChatStatus(options: {
  threadId: string;
  status: "OPEN" | "PENDING" | "CLOSED";
}): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.supportChatThread.update({
      where: { id: options.threadId },
      data: { status: options.status },
    });
    publishSupportChatEvent({
      type: "thread",
      threadId: options.threadId,
      status: options.status,
    });
    revalidatePath("/admin/support-chat");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateSupportChatStatus error:", error);
    return { success: false, error: "Failed to update status" };
  }
}

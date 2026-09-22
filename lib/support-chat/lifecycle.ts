import prisma from "@/lib/prisma";
import { publishSupportChatEvent } from "@/lib/support-chat/realtime-hub";

/** Customer silent this long → dispose to Archive. */
export const SUPPORT_CHAT_INACTIVE_MS = 30 * 60 * 1000;

/** Archived threads are hard-deleted after this TTL. */
export const SUPPORT_CHAT_ARCHIVE_TTL_MS = 72 * 60 * 60 * 1000;

export type SupportChatLifecycleResult = {
  archived: number;
  deleted: number;
};

/**
 * 1) Archive OPEN/PENDING threads where the customer has been inactive 30+ min
 *    (based on last CUSTOMER message, else thread createdAt).
 * 2) Permanently delete ARCHIVED threads older than 72 hours.
 */
export async function maintainSupportChatLifecycle(): Promise<SupportChatLifecycleResult> {
  const now = Date.now();
  const inactiveBefore = new Date(now - SUPPORT_CHAT_INACTIVE_MS);
  const purgeBefore = new Date(now - SUPPORT_CHAT_ARCHIVE_TTL_MS);

  const candidates = await prisma.supportChatThread.findMany({
    where: { status: { in: ["OPEN", "PENDING"] } },
    select: {
      id: true,
      createdAt: true,
      messages: {
        where: { sender: "CUSTOMER" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const toArchive = candidates.filter((thread) => {
    const lastCustomerAt = thread.messages[0]?.createdAt ?? thread.createdAt;
    return lastCustomerAt <= inactiveBefore;
  });

  let archived = 0;
  for (const thread of toArchive) {
    const archivedAt = new Date();
    await prisma.$transaction([
      prisma.supportChatThread.update({
        where: { id: thread.id },
        data: {
          status: "ARCHIVED",
          archivedAt,
          lastMessageAt: archivedAt,
        },
      }),
      prisma.supportChatMessage.create({
        data: {
          threadId: thread.id,
          sender: "SYSTEM",
          body: "Chat closed due to inactivity (no customer reply for 30 minutes). Moved to Archive for 72 hours.",
        },
      }),
    ]);
    publishSupportChatEvent({
      type: "thread",
      threadId: thread.id,
      status: "ARCHIVED",
    });
    archived += 1;
  }

  const purged = await prisma.supportChatThread.deleteMany({
    where: {
      status: "ARCHIVED",
      OR: [
        { archivedAt: { lte: purgeBefore } },
        // Legacy safety: archived without timestamp → use updatedAt
        { archivedAt: null, updatedAt: { lte: purgeBefore } },
      ],
    },
  });

  return { archived, deleted: purged.count };
}

import prisma from "@/lib/prisma";

export type AdminNavBadges = {
  pendingProductApprovals: number;
  openLiveChats: number;
};

/** Counts for Super Admin sidebar badges. */
export async function getAdminNavBadges(): Promise<AdminNavBadges> {
  const [pendingProductApprovals, openLiveChats] = await Promise.all([
    prisma.product.count({
      where: { approvalStatus: "PENDING_APPROVAL" },
    }),
    prisma.supportChatThread.count({
      where: { status: { in: ["OPEN", "PENDING"] } },
    }),
  ]);

  return { pendingProductApprovals, openLiveChats };
}

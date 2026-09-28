/**
 * Force public support email to support@vidyora.co.in in SiteSettings.
 * Does not change admin login accounts.
 */
import { PrismaClient } from "@prisma/client";

const SUPPORT_EMAIL = "support@vidyora.co.in";
const prisma = new PrismaClient();

async function main() {
  const row = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    console.log("No SiteSettings row found — defaults already use", SUPPORT_EMAIL);
    return;
  }

  const data =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (JSON.parse(JSON.stringify(row.data)) as Record<string, unknown>)
      : {};

  const contact =
    data.contact && typeof data.contact === "object" && !Array.isArray(data.contact)
      ? ({ ...(data.contact as Record<string, unknown>) })
      : {};

  const prev = typeof contact.supportEmail === "string" ? contact.supportEmail : null;
  if (prev === SUPPORT_EMAIL) {
    console.log(`supportEmail already ${SUPPORT_EMAIL}`);
    return;
  }

  contact.supportEmail = SUPPORT_EMAIL;
  data.contact = contact;

  await prisma.siteSettings.update({
    where: { id: row.id },
    data: { data },
  });

  console.log(`supportEmail: ${prev ?? "(missing)"} → ${SUPPORT_EMAIL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

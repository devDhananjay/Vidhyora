"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSiteSettings } from "@/lib/content/get-site-settings";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(200),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject is required").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export async function submitContactMessage(
  raw: ContactInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid form",
      };
    }

    const data = parsed.data;
    const row = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        status: "NEW",
      },
    });

    try {
      const settings = await getSiteSettings();
      const supportEmail = settings.contact.supportEmail;
      if (supportEmail) {
        await sendEmail({
          to: { email: supportEmail, name: "VIDYORA Support" },
          subject: `[Contact] ${data.subject}`,
          html: `
            <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p>${data.message.replace(/\n/g, "<br/>")}</p>
          `,
          text: `From: ${data.name} <${data.email}>\nPhone: ${data.phone || "-"}\n\n${data.message}`,
        });
      }
    } catch (emailError) {
      console.error("Contact support email failed:", emailError);
    }

    revalidatePath("/admin/contact-messages");
    return { success: true, data: { id: row.id } };
  } catch (error) {
    console.error("submitContactMessage error:", error);
    return { success: false, error: "Failed to send message. Please try again." };
  }
}

export async function markContactMessageRead(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.contactMessage.update({
      where: { id },
      data: { status: "READ" },
    });
    revalidatePath("/admin/contact-messages");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("markContactMessageRead error:", error);
    return { success: false, error: "Failed to update message" };
  }
}

export async function archiveContactMessage(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.contactMessage.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    revalidatePath("/admin/contact-messages");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("archiveContactMessage error:", error);
    return { success: false, error: "Failed to archive message" };
  }
}

export async function deleteContactMessage(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.contactMessage.delete({ where: { id } });
    revalidatePath("/admin/contact-messages");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deleteContactMessage error:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function getContactMessages(status?: string) {
  try {
    await requireAdmin();
    return prisma.contactMessage.findMany({
      where:
        status && status !== "ALL"
          ? { status: status.toUpperCase() }
          : undefined,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getContactMessages error:", error);
    return [];
  }
}

/**
 * Email sending — SMTP via EMAIL_SERVER, otherwise log in development.
 */

import nodemailer from "nodemailer";

export type EmailRecipient = {
  email: string;
  name?: string;
};

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type SendEmailOptions = {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

export type EmailTemplate = {
  subject: string;
  html: string;
  text?: string;
};

function recipientList(to: SendEmailOptions["to"]): EmailRecipient[] {
  return Array.isArray(to) ? to : [to];
}

export function isEmailConfigured() {
  const server = process.env.EMAIL_SERVER?.trim();
  if (!server) return false;
  if (server.includes("smtp.example.com")) return false;
  if (server.includes("user:pass@")) return false;
  return true;
}

function fromAddress(options?: SendEmailOptions["from"]) {
  if (options?.email) {
    return options.name
      ? `${options.name} <${options.email}>`
      : options.email;
  }
  return process.env.EMAIL_FROM?.trim() || "VIDYORA <support@vidyora.co.in>";
}

type EmailProviderMessage = {
  to: string | string[] | EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
};

function toRecipients(
  to: EmailProviderMessage["to"],
): EmailRecipient | EmailRecipient[] {
  if (Array.isArray(to)) {
    return to.map((item) =>
      typeof item === "string" ? { email: item } : item,
    );
  }
  return typeof to === "string" ? { email: to } : to;
}

/** Adapter used by auth emails (`send-verification`, `send-password-reset`). */
export function getEmailProvider() {
  return {
    send(message: EmailProviderMessage) {
      return sendEmail({
        to: toRecipients(message.to),
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    },
  };
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const to = recipientList(options.to);
  const addresses = to.map((item) => item.email).filter(Boolean);

  if (addresses.length === 0) {
    throw new Error("No email recipients");
  }

  if (!isEmailConfigured()) {
    console.log("📧 Email skipped (SMTP not configured):", {
      to: addresses.join(", "),
      subject: options.subject,
    });
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Email is not configured. Set EMAIL_SERVER (SMTP URL) and EMAIL_FROM.",
      );
    }
    return;
  }

  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

  await transporter.sendMail({
    from: fromAddress(options.from),
    to: addresses,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments,
  });
}

export { EMAIL_TEMPLATES } from "@/lib/email/legacy-templates";

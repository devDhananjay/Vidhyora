import { wrapBrandEmail } from "@/lib/email/brand-layout";
import { getEmailAppUrl, escapeHtml } from "@/lib/email/app-url";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
) {
  const { getEmailProvider } = await import("@/lib/email");
  const emailProvider = getEmailProvider();
  const verificationUrl = `${getEmailAppUrl()}/verify-email?token=${token}`;
  const safeName = escapeHtml(name || "there");

  const html = wrapBrandEmail({
    preheader: "Please verify your VIDYORA email address.",
    eyebrow: "Account verification",
    title: "Confirm your email",
    bodyHtml: `<p style="margin:0 0 16px;">Dear ${safeName},</p>
      <p style="margin:0 0 12px;">Thank you for joining VIDYORA. Please confirm this email so we can keep your jewellery, orders and offers safe.</p>
      <p style="margin:0 0 12px;font-size:13px;color:#7a6a64;word-break:break-all;">${escapeHtml(verificationUrl)}</p>`,
    cta: { label: "Verify email address", url: verificationUrl },
    footnote: "This link expires in 1 hour. If you did not create an account, you can ignore this email.",
  });

  await emailProvider.send({
    to: email,
    subject: "Verify your email — VIDYORA",
    html,
    text: `Hi ${name},\n\nVerify your VIDYORA email:\n${verificationUrl}\n\nThis link expires in 1 hour.`,
  });
}

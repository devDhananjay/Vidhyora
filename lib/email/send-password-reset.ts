import { wrapBrandEmail } from "@/lib/email/brand-layout";
import { getEmailAppUrl, escapeHtml } from "@/lib/email/app-url";

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
) {
  const { getEmailProvider } = await import("@/lib/email");
  const emailProvider = getEmailProvider();
  const resetUrl = `${getEmailAppUrl()}/reset-password?token=${token}`;
  const safeName = escapeHtml(name || "there");

  const html = wrapBrandEmail({
    preheader: "Reset your VIDYORA password.",
    eyebrow: "Password",
    title: "Reset your password",
    bodyHtml: `<p style="margin:0 0 16px;">Dear ${safeName},</p>
      <p style="margin:0 0 12px;">We received a request to reset the password on your VIDYORA account. The link below is valid for one hour.</p>
      <p style="margin:0 0 12px;font-size:13px;color:#7a6a64;word-break:break-all;">${escapeHtml(resetUrl)}</p>`,
    cta: { label: "Reset password", url: resetUrl },
    footnote: "If you did not ask for this, you can ignore the email. Your password will stay the same.",
  });

  await emailProvider.send({
    to: email,
    subject: "Reset your password — VIDYORA",
    html,
    text: `Hi ${name},\n\nReset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

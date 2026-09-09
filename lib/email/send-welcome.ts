import { sendEmail } from "@/lib/email";
import {
  defaultCampaignCopy,
  renderCampaignEmail,
} from "@/lib/email/campaign-templates";

export async function sendWelcomeEmail(email: string, name?: string | null) {
  const copy = defaultCampaignCopy("WELCOME");
  const displayName = name?.trim() || "there";
  const html = renderCampaignEmail({
    type: "WELCOME",
    name: displayName,
    headline: copy.headline,
    body: copy.body,
    ctaLabel: copy.ctaLabel,
    ctaUrl: copy.ctaUrl,
    eyebrow: copy.eyebrow,
    footnote: copy.footnote,
  });

  await sendEmail({
    to: { email, name: displayName },
    subject: copy.subject,
    html,
    text: `Welcome to VIDYORA, ${displayName}. Explore jewellery at ${copy.ctaUrl}`,
  });
}

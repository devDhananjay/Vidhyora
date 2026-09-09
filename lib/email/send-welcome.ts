import { sendEmail } from "@/lib/email";
import { emailAssetUrl } from "@/lib/email/app-url";
import {
  defaultCampaignCopy,
  renderCampaignEmail,
} from "@/lib/email/campaign-templates";

export async function sendWelcomeEmail(email: string, name?: string | null) {
  const copy = defaultCampaignCopy("WELCOME");
  const displayName = name?.trim() || "there";
  const ctaUrl = emailAssetUrl(copy.ctaUrl);
  const html = renderCampaignEmail({
    type: "WELCOME",
    name: displayName,
    headline: copy.headline,
    body: copy.body,
    ctaLabel: copy.ctaLabel,
    ctaUrl,
    eyebrow: copy.eyebrow,
    footnote: copy.footnote,
    heroImage: copy.heroImage,
    heroAlt: copy.heroAlt,
  });

  await sendEmail({
    to: { email, name: displayName },
    subject: copy.subject,
    html,
    text: `Welcome to VIDYORA, ${displayName}. Explore jewellery at ${ctaUrl}`,
  });
}

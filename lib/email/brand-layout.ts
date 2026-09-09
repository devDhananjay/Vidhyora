import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { getEmailAppUrl, escapeHtml } from "@/lib/email/app-url";

const MAROON = "#8b2e2e";
const INK = "#2b1a16";
const CREAM = "#faf8f6";
const GOLD = "#c4a574";

export type EmailCta = {
  label: string;
  url: string;
};

export function wrapBrandEmail(options: {
  preheader?: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: EmailCta | null;
  extraHtml?: string;
  footnote?: string;
}) {
  const appUrl = getEmailAppUrl().replace(
    /http:\/\/localhost:\d+/,
    "https://vidyora.co.in",
  );
  const year = new Date().getFullYear();
  const cta = options.cta
    ? `<tr>
        <td align="center" style="padding: 8px 0 28px;">
          <a href="${escapeHtml(options.cta.url)}" style="display:inline-block;background:${MAROON};color:#ffffff;text-decoration:none;font-family:Georgia,serif;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;padding:14px 28px;border-radius:999px;">
            ${escapeHtml(options.cta.label)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader || "")}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${CREAM};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #efe8e2;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background:${MAROON};padding:28px 32px;text-align:center;">
              <img src="cid:vidyora-logo" alt="${APP_NAME}" width="96" height="96" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
              <p style="margin:14px 0 0;font-family:Georgia,serif;color:#f7e7d8;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;">${escapeHtml(APP_TAGLINE)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 8px;font-family:Georgia,serif;color:${INK};">
              ${
                options.eyebrow
                  ? `<p style="margin:0 0 10px;color:${GOLD};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;">${escapeHtml(options.eyebrow)}</p>`
                  : ""
              }
              <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;font-weight:normal;color:${MAROON};">${escapeHtml(options.title)}</h1>
              <div style="font-family:Georgia,serif;font-size:16px;line-height:1.7;color:${INK};">
                ${options.bodyHtml}
              </div>
            </td>
          </tr>
          ${options.extraHtml || ""}
          ${cta}
          <tr>
            <td style="padding:0 36px 28px;font-family:Georgia,serif;font-size:13px;line-height:1.6;color:#7a6a64;">
              ${options.footnote ? `<p style="margin:0;">${escapeHtml(options.footnote)}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="background:${CREAM};padding:20px 32px;text-align:center;font-family:Georgia,serif;font-size:12px;color:#8a7a74;border-top:1px solid #efe8e2;">
              <p style="margin:0 0 6px;">${APP_NAME} · Fine jewellery from India</p>
              <p style="margin:0;">
                <a href="${appUrl}" style="color:${MAROON};text-decoration:none;">${appUrl.replace(/^https?:\/\//, "")}</a>
              </p>
              <p style="margin:10px 0 0;">© ${year} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

import { wrapBrandEmail } from "@/lib/email/brand-layout";
import { escapeHtml } from "@/lib/email/app-url";

type EmailTemplate = {
  subject: string;
  html: string;
  text?: string;
};

type OrderConfirmationItem = {
  name: string;
  quantity: number;
  lineTotal: string;
  variantLabel?: string | null;
};

type OrderConfirmationData = {
  customerName: string;
  orderNumber: string;
  orderTotal: string;
  orderLink: string;
  items?: OrderConfirmationItem[];
  subtotal?: string;
  discount?: string;
  shippingFee?: string;
  giftPackagingFee?: string;
  tax?: string;
  shippingLines?: string[];
};

function orderItemsTable(items: OrderConfirmationItem[]) {
  if (items.length === 0) return "";

  const rows = items
    .map((item) => {
      const meta = item.variantLabel
        ? `<br /><span style="font-size:12px;color:#7a6a64;">${escapeHtml(item.variantLabel)} · Qty ${item.quantity}</span>`
        : `<br /><span style="font-size:12px;color:#7a6a64;">Qty ${item.quantity}</span>`;
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #efe8e2;font-family:Georgia,serif;font-size:14px;color:#2b1a16;vertical-align:top;">
          ${escapeHtml(item.name)}${meta}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #efe8e2;font-family:Georgia,serif;font-size:14px;color:#2b1a16;text-align:right;vertical-align:top;white-space:nowrap;">
          ${escapeHtml(item.lineTotal)}
        </td>
      </tr>`;
    })
    .join("");

  return `<tr>
    <td style="padding:8px 36px 4px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f6;border:1px solid #efe8e2;border-radius:14px;padding:8px 18px;">
        <tr>
          <td style="padding:12px 0 4px;font-family:Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c4a574;">
            Order details
          </td>
        </tr>
        ${rows}
      </table>
    </td>
  </tr>`;
}

function totalsBlock(data: OrderConfirmationData) {
  const lines: Array<[string, string]> = [];
  if (data.subtotal) lines.push(["Subtotal", data.subtotal]);
  if (data.discount && data.discount !== "₹0") {
    lines.push(["Discount", `− ${data.discount}`]);
  }
  if (data.shippingFee) {
    lines.push([
      "Shipping",
      data.shippingFee === "₹0" ? "Free" : data.shippingFee,
    ]);
  }
  if (data.giftPackagingFee && data.giftPackagingFee !== "₹0") {
    lines.push(["Gift packaging", data.giftPackagingFee]);
  }
  if (data.tax && data.tax !== "₹0") lines.push(["Tax", data.tax]);

  const rows = lines
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:4px 0;font-family:Georgia,serif;font-size:13px;color:#7a6a64;">${escapeHtml(label)}</td>
          <td style="padding:4px 0;font-family:Georgia,serif;font-size:13px;color:#2b1a16;text-align:right;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `<tr>
    <td style="padding:12px 36px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${rows}
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid #efe8e2;font-family:Georgia,serif;font-size:15px;color:#2b1a16;font-weight:bold;">Total paid</td>
          <td style="padding:12px 0 0;border-top:1px solid #efe8e2;font-family:Georgia,serif;font-size:16px;color:#8b2e2e;text-align:right;font-weight:bold;">${escapeHtml(data.orderTotal)}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function shippingBlock(lines?: string[]) {
  if (!lines || lines.length === 0) return "";
  return `<tr>
    <td style="padding:4px 36px 16px;">
      <div style="border:1px solid #efe8e2;border-radius:14px;padding:16px 18px;font-family:Georgia,serif;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c4a574;">Shipping to</p>
        ${lines
          .map(
            (line) =>
              `<p style="margin:0 0 2px;font-size:14px;line-height:1.5;color:#2b1a16;">${escapeHtml(line)}</p>`,
          )
          .join("")}
      </div>
    </td>
  </tr>`;
}

/** Older transactional templates kept for existing imports. */
export const EMAIL_TEMPLATES = {
  orderConfirmation: (data: OrderConfirmationData): EmailTemplate => {
    const firstName =
      data.customerName.trim().split(/\s+/)[0] || data.customerName || "there";
    const itemCount = data.items?.length ?? 0;
    const itemsSummary =
      itemCount > 0
        ? data.items!
            .map(
              (item) =>
                `• ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity} — ${item.lineTotal}`,
            )
            .join("\n")
        : "";

    return {
      subject: `Order confirmed — ${data.orderNumber}`,
      html: wrapBrandEmail({
        preheader: `Thank you! Order ${data.orderNumber} for ${data.orderTotal} is confirmed.`,
        eyebrow: "Order confirmation",
        title: "Thank you for your order",
        bodyHtml: `<p style="margin:0 0 16px;">Dear ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 12px;">We've received your order and our jewellers are preparing it with care.</p>
          <p style="margin:0 0 4px;font-size:13px;color:#7a6a64;">Order number</p>
          <p style="margin:0 0 12px;font-size:18px;letter-spacing:0.04em;color:#8b2e2e;">${escapeHtml(data.orderNumber)}</p>`,
        extraHtml: `${orderItemsTable(data.items ?? [])}${totalsBlock(data)}${shippingBlock(data.shippingLines)}`,
        cta: { label: "View your order", url: data.orderLink },
        footnote:
          "You'll get another email when your order ships. Questions? Reply to this message or visit Help on VIDYORA.",
      }),
      text: `Hi ${data.customerName},

Thank you for your VIDYORA order!

Order: ${data.orderNumber}
Total: ${data.orderTotal}

${itemsSummary ? `Items:\n${itemsSummary}\n\n` : ""}View order: ${data.orderLink}

You'll hear from us again when it ships.`,
    };
  },
  orderShipped: (data: {
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    trackingLink?: string;
  }): EmailTemplate => ({
    subject: `Your Order ${data.orderNumber} Has Shipped!`,
    html: wrapBrandEmail({
      preheader: `Order ${data.orderNumber} is on its way.`,
      eyebrow: "Shipping update",
      title: "Your order has shipped",
      bodyHtml: `<p style="margin:0 0 16px;">Dear ${escapeHtml(data.customerName.split(/\s+/)[0] || data.customerName)},</p>
        <p style="margin:0 0 12px;">Good news — order <strong>${escapeHtml(data.orderNumber)}</strong> is on its way to you.</p>
        ${
          data.trackingNumber
            ? `<p style="margin:0 0 12px;">Tracking number: <strong>${escapeHtml(data.trackingNumber)}</strong></p>`
            : ""
        }`,
      cta: data.trackingLink
        ? { label: "Track shipment", url: data.trackingLink }
        : null,
      footnote: "Thank you for shopping with VIDYORA.",
    }),
    text: `Your order ${data.orderNumber} has shipped!${data.trackingNumber ? ` Tracking: ${data.trackingNumber}` : ""}`,
  }),
  productApproved: (data: {
    sellerName: string;
    productName: string;
    productLink: string;
  }): EmailTemplate => ({
    subject: `Product Approved: ${data.productName}`,
    html: `<p>Hi ${escapeHtml(data.sellerName)}, "${escapeHtml(data.productName)}" is live. <a href="${escapeHtml(data.productLink)}">View</a></p>`,
    text: `Your product "${data.productName}" has been approved!`,
  }),
  productRejected: (data: {
    sellerName: string;
    productName: string;
    reason: string;
  }): EmailTemplate => ({
    subject: `Product Needs Changes: ${data.productName}`,
    html: `<p>Hi ${escapeHtml(data.sellerName)}, "${escapeHtml(data.productName)}" needs changes. Reason: ${escapeHtml(data.reason)}</p>`,
    text: `Your product "${data.productName}" needs changes. Reason: ${data.reason}`,
  }),
  welcome: (data: { name: string; role: string }): EmailTemplate => ({
    subject: "Welcome to VIDYORA!",
    html: `<p>Hi ${escapeHtml(data.name)}, welcome to VIDYORA as a ${escapeHtml(data.role.toLowerCase())}.</p>`,
    text: `Welcome to VIDYORA, ${data.name}!`,
  }),
  passwordReset: (data: { name: string; resetLink: string }): EmailTemplate => ({
    subject: "Reset Your Password",
    html: `<p>Hi ${escapeHtml(data.name)}, <a href="${escapeHtml(data.resetLink)}">reset your password</a>. Expires in 1 hour.</p>`,
    text: `Reset your password: ${data.resetLink}`,
  }),
  orderCancelled: (data: {
    customerName: string;
    orderNumber: string;
    reason?: string;
    orderLink: string;
  }): EmailTemplate => ({
    subject: `Order cancelled — ${data.orderNumber}`,
    html: wrapBrandEmail({
      preheader: `Order ${data.orderNumber} has been cancelled.`,
      eyebrow: "Order update",
      title: "Order cancelled",
      bodyHtml: `<p style="margin:0 0 16px;">Dear ${escapeHtml(data.customerName.split(/\s+/)[0] || data.customerName)},</p>
        <p style="margin:0 0 12px;">Your order <strong>${escapeHtml(data.orderNumber)}</strong> has been cancelled.${data.reason ? ` Reason: ${escapeHtml(data.reason)}` : ""}</p>`,
      cta: { label: "View order", url: data.orderLink },
    }),
    text: `Order ${data.orderNumber} cancelled.${data.reason ? ` Reason: ${data.reason}` : ""}`,
  }),
  returnStatus: (data: {
    customerName: string;
    orderNumber: string;
    statusLabel: string;
    note?: string;
    orderLink: string;
  }): EmailTemplate => ({
    subject: `Return update — ${data.orderNumber}`,
    html: wrapBrandEmail({
      preheader: `Return for ${data.orderNumber}: ${data.statusLabel}`,
      eyebrow: "Return update",
      title: "Return status update",
      bodyHtml: `<p style="margin:0 0 16px;">Dear ${escapeHtml(data.customerName.split(/\s+/)[0] || data.customerName)},</p>
        <p style="margin:0 0 12px;">Your return for order <strong>${escapeHtml(data.orderNumber)}</strong> is now <strong>${escapeHtml(data.statusLabel)}</strong>.${data.note ? ` ${escapeHtml(data.note)}` : ""}</p>`,
      cta: { label: "View order", url: data.orderLink },
    }),
    text: `Return for ${data.orderNumber}: ${data.statusLabel}.${data.note ? ` ${data.note}` : ""}`,
  }),
};

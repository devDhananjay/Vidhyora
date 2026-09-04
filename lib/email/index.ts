/**
 * Email Notification Service
 * Flexible email service supporting multiple providers
 */

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

// Email Templates
export const EMAIL_TEMPLATES = {
  // Order Confirmation
  orderConfirmation: (data: {
    customerName: string;
    orderNumber: string;
    orderTotal: string;
    orderLink: string;
  }): EmailTemplate => ({
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Thank you for your order!</h1>
        <p>Hi ${data.customerName},</p>
        <p>Your order has been confirmed and is being processed.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Total:</strong> ${data.orderTotal}</p>
        </div>
        <p>
          <a href="${data.orderLink}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Order
          </a>
        </p>
        <p>Thank you for shopping with VIDYORA!</p>
      </div>
    `,
    text: `Thank you for your order! Order Number: ${data.orderNumber}, Total: ${data.orderTotal}`,
  }),

  // Order Shipped
  orderShipped: (data: {
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    trackingLink?: string;
  }): EmailTemplate => ({
    subject: `Your Order ${data.orderNumber} Has Shipped!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your order is on the way!</h1>
        <p>Hi ${data.customerName},</p>
        <p>Good news! Your order has shipped and is on its way to you.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Shipping Information</h2>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ""}
        </div>
        ${data.trackingLink ? `
          <p>
            <a href="${data.trackingLink}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Track Shipment
            </a>
          </p>
        ` : ""}
        <p>Thank you for shopping with VIDYORA!</p>
      </div>
    `,
    text: `Your order ${data.orderNumber} has shipped! ${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ""}`,
  }),

  // Product Approved
  productApproved: (data: {
    sellerName: string;
    productName: string;
    productLink: string;
  }): EmailTemplate => ({
    subject: `Product Approved: ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Product Approved!</h1>
        <p>Hi ${data.sellerName},</p>
        <p>Your product "${data.productName}" has been approved and is now live on VIDYORA!</p>
        <p>
          <a href="${data.productLink}" style="background: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Product
          </a>
        </p>
      </div>
    `,
    text: `Your product "${data.productName}" has been approved!`,
  }),

  // Product Rejected
  productRejected: (data: {
    sellerName: string;
    productName: string;
    reason: string;
  }): EmailTemplate => ({
    subject: `Product Needs Changes: ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">Product Needs Changes</h1>
        <p>Hi ${data.sellerName},</p>
        <p>Your product "${data.productName}" needs some changes before it can be approved.</p>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <strong>Reason:</strong> ${data.reason}
        </div>
        <p>Please update your product and resubmit for approval.</p>
      </div>
    `,
    text: `Your product "${data.productName}" needs changes. Reason: ${data.reason}`,
  }),

  // Welcome Email
  welcome: (data: { name: string; role: string }): EmailTemplate => ({
    subject: "Welcome to VIDYORA!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to VIDYORA!</h1>
        <p>Hi ${data.name},</p>
        <p>Thank you for joining VIDYORA as a ${data.role.toLowerCase()}.</p>
        <p>We're excited to have you on board!</p>
        <p>Get started by exploring our platform and discovering amazing products.</p>
      </div>
    `,
    text: `Welcome to VIDYORA, ${data.name}!`,
  }),

  // Password Reset
  passwordReset: (data: { name: string; resetLink: string }): EmailTemplate => ({
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p>
          <a href="${data.resetLink}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Reset your password: ${data.resetLink}`,
  }),
};

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

/**
 * Send email using configured provider
 * For development: Logs to console
 * For production: Replace with actual email service (Resend, SendGrid, etc.)
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  // Development: Log to console
  if (process.env.NODE_ENV === "development") {
    console.log("📧 Email would be sent:", {
      to: Array.isArray(options.to) ? options.to.map((r) => r.email).join(", ") : options.to.email,
      subject: options.subject,
      preview: options.html.substring(0, 100) + "...",
    });
    return;
  }

  // Production: Implement actual email sending
  // Example with Resend:
  // const { Resend } = require("resend");
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: options.from?.email || process.env.EMAIL_FROM!,
  //   to: Array.isArray(options.to) ? options.to.map(r => r.email) : [options.to.email],
  //   subject: options.subject,
  //   html: options.html,
  //   text: options.text,
  // });
}

// =============================================================================
// PRODUCTION IMPLEMENTATION GUIDE
// =============================================================================
/**
 * To use Resend in production:
 * 
 * 1. Install Resend:
 *    npm install resend
 * 
 * 2. Add environment variables:
 *    RESEND_API_KEY=re_xxx
 *    EMAIL_FROM=VIDYORA <noreply@vidyora.com>
 * 
 * 3. Replace sendEmail function with:
 * 
 *    import { Resend } from "resend";
 *    const resend = new Resend(process.env.RESEND_API_KEY);
 * 
 *    export async function sendEmail(options: SendEmailOptions) {
 *      const recipients = Array.isArray(options.to) 
 *        ? options.to.map(r => r.email) 
 *        : [options.to.email];
 * 
 *      await resend.emails.send({
 *        from: options.from?.email || process.env.EMAIL_FROM!,
 *        to: recipients,
 *        subject: options.subject,
 *        html: options.html,
 *        text: options.text,
 *        attachments: options.attachments,
 *      });
 *    }
 */

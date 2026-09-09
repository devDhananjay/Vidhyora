type EmailTemplate = {
  subject: string;
  html: string;
  text?: string;
};

/** Older transactional templates kept for existing imports. */
export const EMAIL_TEMPLATES = {
  orderConfirmation: (data: {
    customerName: string;
    orderNumber: string;
    orderTotal: string;
    orderLink: string;
  }): EmailTemplate => ({
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `<p>Hi ${data.customerName}, your order ${data.orderNumber} (${data.orderTotal}) is confirmed. <a href="${data.orderLink}">View order</a></p>`,
    text: `Thank you for your order! Order Number: ${data.orderNumber}, Total: ${data.orderTotal}`,
  }),
  orderShipped: (data: {
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    trackingLink?: string;
  }): EmailTemplate => ({
    subject: `Your Order ${data.orderNumber} Has Shipped!`,
    html: `<p>Hi ${data.customerName}, order ${data.orderNumber} has shipped.${data.trackingNumber ? ` Tracking: ${data.trackingNumber}` : ""}</p>`,
    text: `Your order ${data.orderNumber} has shipped!`,
  }),
  productApproved: (data: {
    sellerName: string;
    productName: string;
    productLink: string;
  }): EmailTemplate => ({
    subject: `Product Approved: ${data.productName}`,
    html: `<p>Hi ${data.sellerName}, "${data.productName}" is live. <a href="${data.productLink}">View</a></p>`,
    text: `Your product "${data.productName}" has been approved!`,
  }),
  productRejected: (data: {
    sellerName: string;
    productName: string;
    reason: string;
  }): EmailTemplate => ({
    subject: `Product Needs Changes: ${data.productName}`,
    html: `<p>Hi ${data.sellerName}, "${data.productName}" needs changes. Reason: ${data.reason}</p>`,
    text: `Your product "${data.productName}" needs changes. Reason: ${data.reason}`,
  }),
  welcome: (data: { name: string; role: string }): EmailTemplate => ({
    subject: "Welcome to VIDYORA!",
    html: `<p>Hi ${data.name}, welcome to VIDYORA as a ${data.role.toLowerCase()}.</p>`,
    text: `Welcome to VIDYORA, ${data.name}!`,
  }),
  passwordReset: (data: { name: string; resetLink: string }): EmailTemplate => ({
    subject: "Reset Your Password",
    html: `<p>Hi ${data.name}, <a href="${data.resetLink}">reset your password</a>. Expires in 1 hour.</p>`,
    text: `Reset your password: ${data.resetLink}`,
  }),
};

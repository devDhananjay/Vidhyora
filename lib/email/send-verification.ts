import { getEmailProvider } from "@/lib/email";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
) {
  const emailProvider = getEmailProvider();
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to VIDYORA!</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Thank you for registering with VIDYORA. Please verify your email address to complete your account setup.</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VIDYORA. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  await emailProvider.send({
    to: email,
    subject: "Verify your email address - VIDYORA",
    html,
    text: `Hi ${name},\n\nThank you for registering with VIDYORA. Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't create this account, please ignore this email.`,
  });
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authConfig, googleProvider } from "@/lib/auth.config";
import {
  hashOtp,
  normalizeIndianPhone,
  phoneAccountEmail,
  phoneLocalDigits,
} from "@/lib/sms/send-sms";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const phoneOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().min(4).max(8),
});

const MAX_OTP_ATTEMPTS = 5;

async function loadUserForToken(user: {
  id?: string | null;
  email?: string | null;
  role?: UserRole;
}) {
  if (user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true },
    });
    if (dbUser) return dbUser;
  }

  if (user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email.toLowerCase() },
      select: { id: true, role: true, isActive: true },
    });
    if (dbUser) return dbUser;
  }

  if (user.id && user.role) {
    return { id: user.id, role: user.role, isActive: true };
  }

  return null;
}

async function authorizePhoneOtp(credentials: unknown) {
  const parsed = phoneOtpSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const e164 =
    normalizeIndianPhone(parsed.data.phone) ||
    (parsed.data.phone.startsWith("+") ? parsed.data.phone : null);
  if (!e164) return null;

  const code = parsed.data.otp.trim();
  const challenge = await prisma.phoneOtpChallenge.findFirst({
    where: {
      phone: e164,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return null;
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) return null;

  const integrations = await import("@/lib/content/integrations-settings")
    .then((m) => m.getIntegrationsSettings())
    .catch(() => null);
  const allowDevBypass =
    process.env.OTP_DEV_BYPASS === "1" || Boolean(integrations?.otpDevBypass);

  const ok = challenge.codeHash === hashOtp(code) || (allowDevBypass && code === "000000");

  if (!ok) {
    await prisma.phoneOtpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return null;
  }

  await prisma.phoneOtpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  const email = phoneAccountEmail(e164);
  const local = phoneLocalDigits(e164);

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ phone: local }, { phone: e164 }, { email }],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        phone: local,
        name: `User ${local.slice(-4)}`,
        role: "CUSTOMER",
        emailVerified: new Date(),
        isActive: true,
      },
    });
  } else if (user.isActive === false) {
    return null;
  } else if (!user.phone) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phone: local },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    googleProvider(),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user?.passwordHash) return null;
        if (user.isActive === false) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      authorize: authorizePhoneOtp,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { isActive: true, emailVerified: true },
      });

      if (dbUser && dbUser.isActive === false) {
        return "/login?error=inactive";
      }

      if (account?.provider === "google" && dbUser && !dbUser.emailVerified) {
        await prisma.user.update({
          where: { email },
          data: { emailVerified: new Date() },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await loadUserForToken(user);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      try {
        const { sendWelcomeEmail } = await import("@/lib/email/send-welcome");
        await sendWelcomeEmail(user.email, user.name);
      } catch (welcomeError) {
        console.error("Welcome email failed:", welcomeError);
      }
    },
  },
});

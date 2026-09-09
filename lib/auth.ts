import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authConfig, googleProvider } from "@/lib/auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

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

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { safeCallbackPath } from "@/lib/auth/callback-url";

type UserRole = "CUSTOMER" | "SELLER" | "ADMIN" | "SUPER_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export function googleProvider() {
  return Google({
    clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret:
      process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
    authorization: {
      params: { prompt: "select_account" },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email?.toLowerCase() ?? null,
        image: profile.picture,
        role: "CUSTOMER",
      };
    },
  });
}

/** Edge-safe config for middleware. No Prisma, bcrypt, or Node crypto. */
export const authConfig = {
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    googleProvider(),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        if (user.role) token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      const relative = url.startsWith("/") ? url : null;
      const fromAbsolute =
        url.startsWith(baseUrl) && url.length > baseUrl.length
          ? url.slice(baseUrl.length)
          : url === baseUrl
            ? "/"
            : null;
      const path = safeCallbackPath(relative ?? fromAbsolute);
      if (path) return `${baseUrl}${path}`;
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;

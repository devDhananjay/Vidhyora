import type { User, UserRole } from "@prisma/client";

export type { User, UserRole };

export type SafeUser = Pick<
  User,
  "id" | "name" | "email" | "phone" | "role" | "isActive" | "image" | "emailVerified" | "createdAt"
>;

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: UserRole;
};

import prisma from "@/lib/prisma";
import crypto from "crypto";

const TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

export async function generateVerificationToken(
  email: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY);

  await prisma.verificationToken.upsert({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
    update: {
      expires,
    },
    create: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

export async function verifyVerificationToken(
  token: string,
): Promise<string | null> {
  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!verificationToken) {
    return null;
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });
    return null;
  }

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
      },
    },
  });

  return verificationToken.identifier;
}

export async function generatePasswordResetToken(
  email: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY);

  await prisma.verificationToken.upsert({
    where: {
      identifier_token: {
        identifier: `reset:${email}`,
        token,
      },
    },
    update: {
      expires,
    },
    create: {
      identifier: `reset:${email}`,
      token,
      expires,
    },
  });

  return token;
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const resetToken = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!resetToken) {
    return null;
  }

  if (resetToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: resetToken.identifier,
          token: resetToken.token,
        },
      },
    });
    return null;
  }

  const email = resetToken.identifier.replace("reset:", "");

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: resetToken.identifier,
        token: resetToken.token,
      },
    },
  });

  return email;
}

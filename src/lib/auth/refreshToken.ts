import crypto from "crypto";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";

const REFRESH_TOKEN_DAYS = 60;

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export async function storeRefreshToken(
  userId: string,
  token: string
) {
  const tokenHash = await argon2.hash(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  return prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });
}

export async function verifyRefreshToken(
  token: string,
  userId: string
) {
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  for (const record of tokens) {
    const valid = await argon2.verify(record.tokenHash, token);
    if (valid) return record;
  }

  return null;
}

export async function revokeRefreshToken(id: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

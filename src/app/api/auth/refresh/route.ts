import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth/jwt";
import {
  verifyRefreshToken,
  revokeRefreshToken,
  generateRefreshToken,
  storeRefreshToken,
} from "@/lib/auth/refreshToken";

export async function POST(req: Request) {
  const { userId, refreshToken } = await req.json();

  const record = await verifyRefreshToken(
    refreshToken,
    userId
  );

  if (!record) {
    return NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 }
    );
  }

  await revokeRefreshToken(record.id);

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "User inactive" },
      { status: 403 }
    );
  }

  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
  });

  const newRefreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, newRefreshToken);

  return NextResponse.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
}

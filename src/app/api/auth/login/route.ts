import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import {
  generateRefreshToken,
  storeRefreshToken,
} from "@/lib/auth/refreshToken";

export async function POST(req: Request) {
  const { email, password } = await req.json();

if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.appUser.findUnique({
    where: { email },
  });
if (!user) {
    return NextResponse.json(
      { error: "No Email found" },
      { status: 404 }
    );
  }
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "User is inactive" },
      { status: 403 }
    );
  }

  const valid = await verifyPassword(
    user.passwordHash,
    password
  );

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid Password" },
      { status: 401 }
    );
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
  });

  const refreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, refreshToken);

  await prisma.appUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles,
    },
  });
}

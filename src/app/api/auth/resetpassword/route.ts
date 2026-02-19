import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = auth.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(token);
    const { newPassword } = await req.json();

    // if (!newPassword || newPassword.length < 8) {
    //   return NextResponse.json(
    //     { error: "Password must be at least 8 characters" },
    //     { status: 400 }
    //   );
    // }

    const passwordHash = await hashPassword(newPassword);

    await prisma.appUser.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { 
        userId: payload.sub,
        revokedAt: null 
      },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}
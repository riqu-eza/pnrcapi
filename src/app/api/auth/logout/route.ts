import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { refreshTokenId } = await req.json();

  await prisma.refreshToken.update({
    where: { id: refreshTokenId },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

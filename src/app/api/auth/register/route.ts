import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const existing = await prisma.appUser.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.appUser.create({
    data: {
      email,
      passwordHash,
      roles: ["tourist"],
      permissions: [],
    },
  });

  return NextResponse.json({ success: true });
}

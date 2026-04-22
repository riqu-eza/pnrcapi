import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { generateToken, tokenExpiry } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email/sendVerification";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // ── 1. Basic validation ────────────────────────────────────────────────────
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // ── 2. Duplicate check ────────────────────────────────────────────────────
  const existing = await prisma.appUser.findUnique({ where: { email } });

  if (existing) {
    // If the account exists but was never verified, resend the link instead
    // of leaking "email already in use" to an attacker.
    if (!existing.isVerified) {
      const token = generateToken();
      const expiry = tokenExpiry(24);

      await prisma.appUser.update({
        where: { email },
        data: { verifyToken: token, verifyTokenExpiry: expiry },
      });

      await sendVerificationEmail(email, token);

      return NextResponse.json(
        { message: "Verification email resent. Please check your inbox." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  // ── 3. Create unverified user ─────────────────────────────────────────────
  const passwordHash = await hashPassword(password);
  const token = generateToken();
  const expiry = tokenExpiry(24);

  await prisma.appUser.create({
    data: {
      email,
      passwordHash,
      roles: ["TOURIST"],
      permissions: [],
      isVerified: false,
      verifyToken: token,
      verifyTokenExpiry: expiry,
    },
  });

  // ── 4. Send verification email ────────────────────────────────────────────
  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    // Don't block registration if email fails; log and continue.
    // In production, consider a retry queue (e.g. BullMQ).
    console.error("[register] Failed to send verification email:", err);
  }

  return NextResponse.json(
    {
      success: true,
      message:
        "Account created. Please check your email to verify your address before logging in.",
    },
    { status: 201 }
  );
}
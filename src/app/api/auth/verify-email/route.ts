import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email/sendVerification";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  // ── 1. Token must be present ───────────────────────────────────────────────
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/auth/verify?error=missing_token`);
  }

  // ── 2. Look up the token ───────────────────────────────────────────────────
  const user = await prisma.appUser.findFirst({
    where: { verifyToken: token },
  });

  if (!user) {
    return NextResponse.redirect(`${BASE_URL}/auth/verify?error=invalid_token`);
  }

  // ── 3. Check expiry ────────────────────────────────────────────────────────
  if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
    return NextResponse.redirect(`${BASE_URL}/auth/verify?error=token_expired`);
  }

  // ── 4. Mark as verified and clear the token ────────────────────────────────
  await prisma.appUser.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    },
  });

  // ── 5. Send welcome email (best-effort) ────────────────────────────────────
  try {
    await sendWelcomeEmail(user.email);
  } catch (err) {
    console.error("[verify-email] Failed to send welcome email:", err);
  }

  return NextResponse.redirect(`${BASE_URL}/auth/verify?success=true`);
}
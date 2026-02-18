import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth/jwt";
import {
  generateRefreshToken,
  storeRefreshToken,
} from "@/lib/auth/refreshToken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  const { idToken } = await req.json();

  if (!idToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!payload.email_verified) {
      return NextResponse.json(
        { error: "Google email not verified" },
        { status: 403 }
      );
    }

    const email = payload.email;
    const googleSub = payload.sub;

    // 1️⃣ Check if identity already exists
    const existingIdentity = await prisma.authIdentity.findUnique({
      where: {
        provider_providerId: {
          provider: "google",
          providerId: googleSub,
        },
      },
      include: { user: true },
    });

    let user;

    if (existingIdentity) {
      user = existingIdentity.user;
    } else {
      // 2️⃣ Auto-link by email
      const existingUser = await prisma.appUser.findUnique({
        where: { email },
      });

      if (existingUser) {
        user = existingUser;

        // Link identity
        await prisma.authIdentity.create({
          data: {
            provider: "google",
            providerId: googleSub,
            userId: user.id,
          },
        });

      } else {
        // 3️⃣ Create new user
        user = await prisma.appUser.create({
          data: {
            email,
            emailVerified: true,
            roles: ["tourist"],
            permissions: [],
            profile: {
              firstName: payload.given_name,
              lastName: payload.family_name,
              avatar: payload.picture,
            },
            identities: {
              create: {
                provider: "google",
                providerId: googleSub,
              },
            },
          },
        });
      }
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "User inactive" },
        { status: 403 }
      );
    }

    // Issue YOUR JWT
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

  } catch {
    return NextResponse.json(
      { error: "Invalid Google token" },
      { status: 401 }
    );
  }
}

import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = auth.replace("Bearer ", "");

  try {
    const user = verifyAccessToken(token);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

// GET /api/blog/scheduled - List scheduled posts
export async function GET(req: Request) {
  // Authenticate
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.replace("Bearer ", "");
  let user;
  
  try {
    user = verifyAccessToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Only admins and content creators can see scheduled posts
  if (!user.roles.includes("admin") && !user.permissions.includes("create_blog")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scheduledPosts = await prisma.blogPost.findMany({
    where: {
      status: "SCHEDULED",
      publishedAt: { gt: new Date() },
    },
    orderBy: { publishedAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      authorId: true,
      publishedAt: true,
      categories: true,
      tags: true,
    },
  });

  return NextResponse.json({ scheduledPosts });
}
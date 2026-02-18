import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

// POST /api/blog/[slug]/like - Toggle like
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Authenticate (optional - you can track anonymous likes too)
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

  const post = await prisma.blogPost.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, stats: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // In a real app, you'd track who liked what in a separate table
  // For now, just increment the counter
  const currentStats = (post.stats as any) || { views: 0, shares: 0, likes: 0 };
  const newStats = {
    ...currentStats,
    likes: (currentStats.likes || 0) + 1,
  };

  await prisma.blogPost.update({
    where: { slug },
    data: { stats: newStats },
  });

  return NextResponse.json({ likes: newStats.likes });
}
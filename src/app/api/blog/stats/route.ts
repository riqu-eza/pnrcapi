import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

// GET /api/blog/stats - Get blog statistics
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

  // Only admins can see stats
  if (!user.roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    scheduledPosts,
    allPosts,
  ] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
    prisma.blogPost.count({ where: { status: "SCHEDULED" } }),
    prisma.blogPost.findMany({
      select: { stats: true },
    }),
  ]);

  // Calculate total views
  const totalViews = allPosts.reduce((sum, post) => {
    const stats = post.stats as any;
    return sum + (stats?.views || 0);
  }, 0);

  // Get most viewed posts
  const mostViewedPosts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      stats: true,
      publishedAt: true,
    },
  });

  // Sort by views (since we can't orderBy JSON field directly)
  mostViewedPosts.sort((a, b) => {
    const aViews = (a.stats as any)?.views || 0;
    const bViews = (b.stats as any)?.views || 0;
    return bViews - aViews;
  });

  const topPosts = mostViewedPosts.slice(0, 10);

  return NextResponse.json({
    totalPosts,
    publishedPosts,
    draftPosts,
    scheduledPosts,
    totalViews,
    topPosts,
  });
}
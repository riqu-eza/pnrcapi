import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/blog/[slug]/views - Increment view count
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, stats: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const currentStats = (post.stats as any) || { views: 0, shares: 0, likes: 0 };
    const newStats = {
      ...currentStats,
      views: (currentStats.views || 0) + 1,
    };

    await prisma.blogPost.update({
      where: { slug },
      data: { stats: newStats },
    });

    return NextResponse.json({ views: newStats.views });
  } catch (error) {
    console.error("View tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
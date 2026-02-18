import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blog/author/[authorId] - Get author profile & posts
export async function GET(
  req: Request,
  { params }: { params: { authorId: string } }
) {
  const { authorId } = params;
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // Get author
  const author = await prisma.appUser.findUnique({
    where: { id: authorId },
    select: {
      id: true,
      email: true,
      profile: true,
      createdAt: true,
    },
  });

  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  // Get posts count
  const totalPosts = await prisma.blogPost.count({
    where: {
      authorId,
      status: "PUBLISHED",
      deletedAt: null,
    },
  });

  // Get posts
  const posts = await prisma.blogPost.findMany({
    where: {
      authorId,
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      deletedAt: null,
    },
    skip,
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      publishedAt: true,
      readingTimeMinutes: true,
      stats: true,
      categories: true,
      tags: true,
    },
  });

  // Calculate total views
  const allPosts = await prisma.blogPost.findMany({
    where: {
      authorId,
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: { stats: true },
  });

  const totalViews = allPosts.reduce((sum, post) => {
    const stats = post.stats as any;
    return sum + (stats?.views || 0);
  }, 0);

  return NextResponse.json({
    author: {
      ...author,
      stats: {
        totalPosts,
        totalViews,
      },
    },
    posts,
    pagination: {
      page,
      limit,
      total: totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
    },
  });
}
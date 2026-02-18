import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blog/categories?slug=travel-tips&page=1&limit=10
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const categorySlug = searchParams.get("slug");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  
  if (!categorySlug) {
    return NextResponse.json({ error: "Category slug required" }, { status: 400 });
  }

  const skip = (page - 1) * limit;

  const where = {
    status: "published",
    publishedAt: { lte: new Date() },
    categories: { has: categorySlug },
  };

  const total = await prisma.blogPost.count({ where });

  const posts = await prisma.blogPost.findMany({
    where,
    skip,
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      authorId: true,
      categories: true,
      tags: true,
      publishedAt: true,
      stats: true,
    },
  });

  return NextResponse.json({
    category: categorySlug,
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
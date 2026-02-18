import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

// GET /api/blog/drafts - List current user's drafts
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

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const where: any = {
    status: "draft",
    authorId: user.sub,
  };

  // Admins can see all drafts
  if (user.roles.includes("admin")) {
    delete where.authorId;
  }

  const total = await prisma.blogPost.count({ where });

  const drafts = await prisma.blogPost.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      authorId: true,
      categories: true,
      tags: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    drafts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
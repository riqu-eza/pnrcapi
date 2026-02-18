import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

// POST /api/blog/[slug]/comments - Add comment
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

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

  // Find post
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED", deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { content, parentId } = await req.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  // Verify parent comment exists if replying
  if (parentId) {
    const parentComment = await prisma.blogComment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment || parentComment.postId !== post.id) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
    }
  }

  try {
    const comment = await prisma.blogComment.create({
      data: {
        postId: post.id,
        userId: user.sub,
        content,
        parentId,
        isApproved: false, // Require moderation
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// GET /api/blog/[slug]/comments - Get comments (with pagination)
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // Find post
  const post = await prisma.blogPost.findUnique({
    where: { slug, deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const total = await prisma.blogComment.count({
    where: {
      postId: post.id,
      parentId: null,
      isApproved: true,
      deletedAt: null,
    },
  });

  const comments = await prisma.blogComment.findMany({
    where: {
      postId: post.id,
      parentId: null,
      isApproved: true,
      deletedAt: null,
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
      replies: {
        where: {
          isApproved: true,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
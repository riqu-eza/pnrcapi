import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { validateBlogPost } from "@/lib/blog/validation";
import { ensureUniqueSlug } from "@/lib/blog/slug";
import { calculateReadingTime } from "@/lib/blog/utils";

// GET /api/blog/[slug] - Get single post with full details
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const post = await prisma.blogPost.findUnique({
    where: { 
      slug,
      deletedAt: null, // Exclude soft-deleted
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
      city: {
        select: {
          id: true,
          name: true,
          slug: true,
          country: true,
          description: true,
          coverImage: true,
          latitude: true,
          longitude: true,
        },
      },
      comments: {
        where: {
          isApproved: true,
          deletedAt: null,
          parentId: null, // Only top-level comments
        },
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
        orderBy: { createdAt: "desc" },
        take: 20, // Limit initial comments
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if post should be visible
  if (post.status !== "PUBLISHED" || (post.publishedAt && post.publishedAt > new Date())) {
    const auth = req.headers.get("authorization");
    
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const token = auth.replace("Bearer ", "");
      const user = verifyAccessToken(token);
      
      if (post.authorId !== user.sub && !user.roles.includes("admin")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Get related places if any
  let relatedPlaces = [];
  if (post.relatedPlaceIds.length > 0) {
    relatedPlaces = await prisma.place.findMany({
      where: {
        id: { in: post.relatedPlaceIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        coverImage: true,
        taxonomy: true,
        cityId: true,
      },
    });
  }

  // Get similar posts based on categories
  const similarPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      deletedAt: null,
      id: { not: post.id },
      OR: [
        { categories: { hasSome: post.categories } },
        { tags: { hasSome: post.tags } },
        { relatedCityId: post.relatedCityId },
      ],
    },
    take: 4,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      publishedAt: true,
      readingTimeMinutes: true,
      author: {
        select: {
          id: true,
          profile: true,
        },
      },
    },
  });

  return NextResponse.json({ 
    post,
    relatedPlaces,
    similarPosts,
  });
}

// PATCH /api/blog/[slug] - Update post
export async function PATCH(
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

  // Find existing post
  const existingPost = await prisma.blogPost.findUnique({
    where: { slug, deletedAt: null },
  });

  if (!existingPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check permissions
  if (existingPost.authorId !== user.sub && !user.roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Build update data
  const updateData: any = {
    lastEditedBy: user.sub,
    lastEditedAt: new Date(),
    version: existingPost.version + 1, // Increment version
  };

  // Update fields
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) {
    updateData.content = body.content;
    updateData.readingTimeMinutes = calculateReadingTime(body.content);
  }
  if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
  if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage;
  if (body.categories !== undefined) updateData.categories = body.categories;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.metaKeywords !== undefined) updateData.metaKeywords = body.metaKeywords;
  if (body.relatedCityId !== undefined) updateData.relatedCityId = body.relatedCityId;
  if (body.relatedPlaceIds !== undefined) updateData.relatedPlaceIds = body.relatedPlaceIds;
  if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
  if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription;
  if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
  if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
  if (body.pinnedUntil !== undefined) {
    updateData.pinnedUntil = body.pinnedUntil ? new Date(body.pinnedUntil) : null;
  }

  // Handle slug change
  if (body.slug && body.slug !== slug) {
    const newSlug = await ensureUniqueSlug(body.slug, existingPost.id);
    updateData.slug = newSlug;
  }

  // Handle status changes
  if (body.status !== undefined) {
    updateData.status = body.status;

    // If publishing for first time
    if (body.status === "PUBLISHED" && !existingPost.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // If scheduling
    if (body.status === "SCHEDULED") {
      if (!body.scheduledFor) {
        return NextResponse.json(
          { error: "Scheduled posts must have scheduledFor date" },
          { status: 400 }
        );
      }
      updateData.scheduledFor = new Date(body.scheduledFor);
    }

    // If archiving
    if (body.status === "ARCHIVED") {
      updateData.publishedAt = null;
    }
  }

  try {
    const updatedPost = await prisma.blogPost.update({
      where: { slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Blog post update error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[slug] - Soft delete post
export async function DELETE(
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
    where: { slug, deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check permissions
  if (post.authorId !== user.sub && !user.roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check query parameter for hard delete
  const { searchParams } = new URL(req.url);
  const hardDelete = searchParams.get("hard") === "true";

  try {
    if (hardDelete && user.roles.includes("admin")) {
      // Only admins can hard delete
      await prisma.blogPost.delete({
        where: { slug },
      });
    } else {
      // Soft delete
      await prisma.blogPost.update({
        where: { slug },
        data: { 
          deletedAt: new Date(),
          lastEditedBy: user.sub,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog post deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
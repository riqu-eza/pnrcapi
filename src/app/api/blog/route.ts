import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { validateBlogPost } from "@/lib/blog/validation";
import { calculateReadingTime } from "@/lib/blog/utils";
import { ensureUniqueSlug, generateSlug } from "@/lib/blog/slug";

// GET /api/blog - List posts with author & city info
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const cityId = searchParams.get("cityId");
  const authorId = searchParams.get("authorId");
  const featured = searchParams.get("featured");
  const sortBy = searchParams.get("sortBy") || "publishedAt";
  const order = searchParams.get("order") || "desc";
  
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where: any = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    deletedAt: null, // Exclude soft-deleted posts
  };

  if (category) {
    where.categories = { has: category };
  }

  if (tag) {
    where.tags = { has: tag };
  }

  if (cityId) {
    where.relatedCityId = cityId;
  }

  if (authorId) {
    where.authorId = authorId;
  }

  if (featured === "true") {
    where.isFeatured = true;
  }

  // Count total
  const total = await prisma.blogPost.count({ where });

  // Fetch posts with relations
  const posts = await prisma.blogPost.findMany({
    where,
    skip,
    take: limit,
    orderBy: getOrderBy(sortBy, order),
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      categories: true,
      tags: true,
      publishedAt: true,
      stats: true,
      readingTimeMinutes: true,
      isFeatured: true,
      isPinned: true,
      // Include author info
      author: {
        select: {
          id: true,
          email: true,
          profile: true, // Contains firstName, lastName, avatar
        },
      },
      // Include city info
      city: {
        select: {
          id: true,
          name: true,
          slug: true,
          country: true,
          coverImage: true,
        },
      },
      // Count comments
      _count: {
        select: {
          comments: {
            where: {
              isApproved: true,
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  // Transform author profile for easier access
  const transformedPosts = posts.map(post => ({
    ...post,
    author: {
      id: post.author.id,
      email: post.author.email,
      ...(post.author.profile as any || {}),
    },
    commentCount: post._count.comments,
  }));

  return NextResponse.json({
    posts: transformedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/blog - Create new post
export async function POST(req: Request) {
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

  // Check permissions
//   if (!user.roles.includes("admin") && !user.permissions.includes("create_blog")) {
//     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//   }

  const body = await req.json();

  // Validate input
  const validation = validateBlogPost(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }

  const {
    title,
    content,
    excerpt,
    featuredImage,
    categories = [],
    tags = [],
    metaKeywords = [],
    relatedCityId,
    relatedPlaceIds = [],
    metaTitle,
    metaDescription,
    status = "DRAFT",
    publishedAt,
    scheduledFor,
    isFeatured = false,
    isPinned = false,
    pinnedUntil,
  } = body;

  // Generate slug
  const baseSlug = body.slug || generateSlug(title);
  const slug = await ensureUniqueSlug(baseSlug);

  // Calculate reading time
  const readingTimeMinutes = calculateReadingTime(content);

  // Determine publishing logic
  let finalStatus = status;
  let finalPublishedAt = publishedAt ? new Date(publishedAt) : null;
  let finalScheduledFor = scheduledFor ? new Date(scheduledFor) : null;

  if (status === "PUBLISHED" && !publishedAt) {
    finalPublishedAt = new Date();
  } else if (status === "SCHEDULED") {
    if (!scheduledFor) {
      return NextResponse.json(
        { error: "Scheduled posts must have scheduledFor date" },
        { status: 400 }
      );
    }
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      finalStatus = "PUBLISHED";
      finalPublishedAt = new Date();
    }
  }

  // Validate city exists if provided
  if (relatedCityId) {
    const cityExists = await prisma.city.findUnique({
      where: { id: relatedCityId },
    });
    if (!cityExists) {
      return NextResponse.json(
        { error: "Related city not found" },
        { status: 400 }
      );
    }
  }

  // Validate places exist if provided
  if (relatedPlaceIds.length > 0) {
    const places = await prisma.place.findMany({
      where: { id: { in: relatedPlaceIds } },
      select: { id: true },
    });
    if (places.length !== relatedPlaceIds.length) {
      return NextResponse.json(
        { error: "Some related places not found" },
        { status: 400 }
      );
    }
  }

  try {
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || generateExcerpt(content),
        featuredImage,
        authorId: user.sub,
        categories,
        tags,
        metaKeywords,
        relatedCityId,
        relatedPlaceIds,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || generateExcerpt(content),
        status: finalStatus,
        publishedAt: finalPublishedAt,
        scheduledFor: finalScheduledFor,
        isFeatured,
        isPinned,
        pinnedUntil: pinnedUntil ? new Date(pinnedUntil) : null,
        readingTimeMinutes,
        lastEditedBy: user.sub,
        stats: {
          views: 0,
          shares: 0,
          likes: 0,
          uniqueVisitors: 0,
          avgReadTime: 0,
        },
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
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Blog post creation error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

function getOrderBy(sortBy: string, order: string) {
  const orderDir = order === "asc" ? "asc" : "desc";
  
  switch (sortBy) {
    case "title":
      return { title: orderDir };
    case "updatedAt":
      return { updatedAt: orderDir };
    case "publishedAt":
    default:
      return { publishedAt: orderDir };
  }
}

function generateExcerpt(content: string, length: number = 300): string {
  const stripped = content.replace(/<[^>]*>/g, "");
  return stripped.length > length
    ? stripped.substring(0, length).trim() + "..."
    : stripped;
}
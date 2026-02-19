// This would typically run as a cron job or scheduled task
// Example using Next.js API route called by external cron service

// app/api/cron/publish-scheduled/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all scheduled posts that should be published now
    const postsToPublish = await prisma.blogPost.findMany({
      where: {
        status: "SCHEDULED",
        publishedAt: {
          lte: new Date(),
        },
      },
    });

    // Update them to published
    const updated = await prisma.blogPost.updateMany({
      where: {
        status: "SCHEDULED",
        publishedAt: {
          lte: new Date(),
        },
      },
      data: {
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({
      success: true,
      published: updated.count,
      posts: postsToPublish.map((p) => ({ id: p.id, title: p.title })),
    });
  } catch (error) {
    console.error("Auto-publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish posts" },
      { status: 500 }
    );
  }
}
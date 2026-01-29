import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import CommunityPost from "@/lib/models/CommunityPost";
import logger from "@/lib/logger";

/**
 * GET /api/community
 * List community posts with optional filters (course, materialId).
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Community GET: unauthenticated request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();
    logger.info("Community GET: fetching posts", { userId });

    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const materialId = searchParams.get("materialId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const query = {};
    if (course) query.course = course;
    if (materialId) query.materialId = materialId;

    const posts = await CommunityPost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    logger.info("Community GET: returning posts", { count: posts.length, query });
    return NextResponse.json({ data: posts });
  } catch (err) {
    logger.error("Community GET failed", { error: err?.message, stack: err?.stack });
    return NextResponse.json(
      { error: err?.message || "Failed to fetch community posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community
 * Create a new community post. Auth required.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Community POST: unauthenticated request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const body = await request.json();
    const { title, postBody, materialId, mentions, course } = body;

    if (!title?.trim() || !postBody?.trim()) {
      logger.warn("Community POST: missing title or body");
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const authorName =
      body.authorName?.trim() ||
      (request.headers.get("x-clerk-user-name") || "Anonymous");

    const post = new CommunityPost({
      title: title.trim(),
      body: postBody.trim(),
      authorId: userId,
      authorName,
      materialId: materialId || null,
      mentions: Array.isArray(mentions) ? mentions : [],
      course: course || null,
    });

    await post.save();
    logger.info("Community POST: created", {
      postId: post._id,
      authorId: userId,
      title: post.title,
    });

    return NextResponse.json({ data: post });
  } catch (err) {
    logger.error("Community POST failed", { error: err?.message, stack: err?.stack });
    return NextResponse.json(
      { error: err?.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

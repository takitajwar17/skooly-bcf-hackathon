import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import CommunityPost from "@/lib/models/CommunityPost";
import CommunityReply from "@/lib/models/CommunityReply";
import logger from "@/lib/logger";

/**
 * POST /api/community/[id]/replies
 * Add a human reply to a community post.
 */
export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Community replies POST: unauthenticated request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      logger.warn("Community replies POST: post not found", { postId: id });
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const content = body?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "Reply content is required" },
        { status: 400 }
      );
    }

    const authorName =
      body?.authorName?.trim() || "Anonymous";

    const reply = new CommunityReply({
      postId: id,
      authorId: userId,
      authorName,
      content,
      isBot: false,
    });

    await reply.save();
    logger.info("Community replies POST: created", {
      replyId: reply._id,
      postId: id,
      authorId: userId,
    });

    return NextResponse.json({ data: reply });
  } catch (err) {
    logger.error("Community replies POST failed", {
      error: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { error: err?.message || "Failed to add reply" },
      { status: 500 }
    );
  }
}

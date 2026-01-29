import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import CommunityPost from "@/lib/models/CommunityPost";
import CommunityReply from "@/lib/models/CommunityReply";
import Material from "@/lib/models/Material";
import logger from "@/lib/logger";

/**
 * GET /api/community/[id]
 * Fetch a single post with its replies. Optionally populate material.
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Community [id] GET: unauthenticated request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    logger.info("Community [id] GET: fetching post", { postId: id });

    const post = await CommunityPost.findById(id).lean();
    if (!post) {
      logger.warn("Community [id] GET: post not found", { postId: id });
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const replies = await CommunityReply.find({ postId: id })
      .sort({ createdAt: 1 })
      .lean();

    let material = null;
    if (post.materialId) {
      material = await Material.findById(post.materialId)
        .select("title topic week category course fileUrl")
        .lean();
    }

    return NextResponse.json({
      data: {
        ...post,
        replies,
        material,
      },
    });
  } catch (err) {
    logger.error("Community [id] GET failed", {
      error: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { error: err?.message || "Failed to fetch post" },
      { status: 500 }
    );
  }
}

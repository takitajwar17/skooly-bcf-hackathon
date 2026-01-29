import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import CommunityPost from "@/lib/models/CommunityPost";
import CommunityReply from "@/lib/models/CommunityReply";
import { generateDirectResponse } from "@/lib/ai/embedding";
import logger from "@/lib/logger";

/** Display name for AI-generated replies */
const BOT_AUTHOR_NAME = "Skooly Bot";

/**
 * POST /api/community/[id]/bot-reply
 * Generate a direct AI bot reply when the intended receiver (e.g. @instructor, @TA)
 * is unavailable. Hits Gemini API only — no RAG/grounding.
 */
export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Community bot-reply POST: unauthenticated request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const post = await CommunityPost.findById(id).lean();
    if (!post) {
      logger.warn("Community bot-reply POST: post not found", { postId: id });
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingBot = await CommunityReply.findOne({
      postId: id,
      isBot: true,
    });
    if (existingBot) {
      logger.info("Community bot-reply POST: bot reply already exists", {
        postId: id,
        replyId: existingBot._id,
      });
      return NextResponse.json({
        data: existingBot,
        message: "Bot reply already present",
      });
    }

    const query = [post.title, post.body].filter(Boolean).join("\n\n");
    logger.info("Community bot-reply POST: generating direct AI reply", {
      postId: id,
      queryLength: query.length,
    });

    const aiResponse = await generateDirectResponse(
      `A student asked in a discussion:\n\n"${query}"\n\nProvide a helpful, concise direct reply to the student.`
    );

    const reply = new CommunityReply({
      postId: id,
      authorId: null,
      authorName: BOT_AUTHOR_NAME,
      content: aiResponse.trim(),
      isBot: true,
      sources: [],
    });

    await reply.save();
    logger.info("Community bot-reply POST: created", {
      replyId: reply._id,
      postId: id,
    });

    return NextResponse.json({ data: reply });
  } catch (err) {
    logger.error("Community bot-reply POST failed", {
      error: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { error: err?.message || "Failed to generate bot reply" },
      { status: 500 }
    );
  }
}

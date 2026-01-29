import mongoose from "mongoose";

/**
 * CommunityReply – Replies to community posts.
 * Human replies vs bot replies (isBot) for grounded AI support when intended receiver is unavailable.
 */
const communityReplySchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
    },
    /** Clerk user ID; null for bot replies */
    authorId: {
      type: String,
      default: null,
    },
    /** Display name: "Skooly Bot" for bot, else user name */
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    /** True for RAG-generated bot replies */
    isBot: {
      type: Boolean,
      default: false,
    },
    /** Material IDs used as RAG sources (bot replies only) */
    sources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material",
      },
    ],
  },
  {
    timestamps: true,
  }
);

communityReplySchema.index({ postId: 1, createdAt: 1 });

const CommunityReply =
  mongoose.models.CommunityReply ||
  mongoose.model("CommunityReply", communityReplySchema);

export default CommunityReply;

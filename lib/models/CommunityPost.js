import mongoose from "mongoose";

/**
 * CommunityPost – Social-style discussion posts for students.
 * Supports optional @mentions (e.g. @instructor, @TA) and optional link to course material.
 */
const communityPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    /** Clerk user ID of the author */
    authorId: {
      type: String,
      required: true,
    },
    /** Display name for author (from Clerk) */
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    /** Optional link to a course material (e.g. "discuss this PDF") */
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
    /** @mentions: e.g. ["instructor", "TA"] – intended receivers; bot can reply when they're unavailable */
    mentions: {
      type: [String],
      default: [],
    },
    /** Course filter for discovery (optional, from linked material or user selection) */
    course: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ authorId: 1, createdAt: -1 });
communityPostSchema.index({ materialId: 1 });
communityPostSchema.index({ course: 1, createdAt: -1 });

const CommunityPost =
  mongoose.models.CommunityPost ||
  mongoose.model("CommunityPost", communityPostSchema);

export default CommunityPost;

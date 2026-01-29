import mongoose from "mongoose";

/**
 * VideoMaterial Schema
 * Stores metadata for AI-generated videos from course content
 */
const videoMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["Theory", "Lab"],
      required: true,
    },
    // Source content that was used to generate the video
    sourceContent: {
      type: String,
      required: true,
    },
    // Video prompt used for generation
    videoPrompt: {
      type: String,
      default: "",
    },
    // Cloudinary URL where video is stored
    videoUrl: {
      type: String,
      default: "",
    },
    // Cloudinary public ID for video management
    cloudinaryPublicId: {
      type: String,
      default: "",
    },
    // Video metadata
    duration: {
      type: Number, // Duration in seconds
      default: 8,
    },
    resolution: {
      type: String,
      enum: ["720p", "1080p", "4k"],
      default: "720p",
    },
    aspectRatio: {
      type: String,
      enum: ["16:9", "9:16"],
      default: "16:9",
    },
    // Reference to source material if generated from existing material
    sourceMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
    },
    // Reference to AI material if generated from AI-generated content
    sourceAiMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AiMaterial",
    },
    // User who generated the video
    generatedBy: {
      type: String, // Clerk User ID
      required: true,
    },
    // Generation status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    // Error message if generation failed
    errorMessage: {
      type: String,
    },
    // Operation name from Veo API for tracking
    operationName: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
videoMaterialSchema.index({ generatedBy: 1, createdAt: -1 });
videoMaterialSchema.index({ course: 1, week: 1 });
videoMaterialSchema.index({ sourceMaterialId: 1 });
videoMaterialSchema.index({ sourceAiMaterialId: 1 });

/**
 * Next.js dev hot-reload + Mongoose model caching can keep an older schema
 * version in memory (e.g., when we remove `required: true` on fields).
 *
 * This guard re-registers the model if we detect the old required constraints,
 * preventing runtime validation failures during development.
 */
if (mongoose.models.VideoMaterial) {
  const existingSchema = mongoose.models.VideoMaterial.schema;
  const requiredPaths = ["videoPrompt", "videoUrl", "cloudinaryPublicId"];

  const hasOldRequiredFlags = requiredPaths.some((p) => {
    const path = existingSchema.path(p);
    return Boolean(path?.isRequired);
  });

  if (hasOldRequiredFlags) {
    mongoose.deleteModel("VideoMaterial");
  }
}

const VideoMaterial =
  mongoose.models.VideoMaterial ||
  mongoose.model("VideoMaterial", videoMaterialSchema);

export default VideoMaterial;

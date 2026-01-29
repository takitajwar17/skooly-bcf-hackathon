import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["theory", "lab"],
      required: [true, "Category is required"],
    },
    type: {
      type: String,
      enum: ["lecture", "pdf", "code", "notes", "reference"],
      default: "pdf",
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
    },
    week: {
      type: Number,
      min: 1,
      max: 20,
      default: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
    filePath: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    uploadedBy: {
      type: String, // Clerk userId
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
materialSchema.index({ category: 1, type: 1 });
materialSchema.index({ topic: 1 });
materialSchema.index({ week: 1 });
materialSchema.index({ tags: 1 });
materialSchema.index({ uploadedBy: 1 });

const Material =
  mongoose.models.Material || mongoose.model("Material", materialSchema);

export default Material;

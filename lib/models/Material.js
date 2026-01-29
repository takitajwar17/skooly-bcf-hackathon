import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  course: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Theory", "Lab"],
  },
  type: {
    type: String,
    required: true,
    enum: ["pdf", "slide", "code", "doc", "link", "text"],
  },
  topic: {
    type: String,
    required: true,
  },
  week: {
    type: Number,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  fileUrl: {
    type: String,
  },
  cloudinaryPublicId: {
    type: String, // For Cloudinary deletion
  },
  content: {
    type: String,
    default: "", // Extracted text content for RAG (legacy, will be deprecated)
  },
  fileSearchDocumentId: {
    type: String, // FileSearchStore document ID for Gemini File Search
  },
  uploadedBy: {
    type: String, // Clerk User ID
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Material =
  mongoose.models.Material || mongoose.model("Material", materialSchema);

export default Material;

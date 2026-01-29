import mongoose from "mongoose";

const handwrittenNoteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Untitled Note",
  },
  content: {
    type: String,
    required: true,
  },
  rawContent: {
    type: String,
  },
  imageUrl: {
    type: String, // Optional: if we want to store the original image URL (e.g., Cloudinary)
  },
  uploadedBy: {
    type: String, // Clerk User ID
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const HandwrittenNote = mongoose.models.HandwrittenNote || mongoose.model("HandwrittenNote", handwrittenNoteSchema);

export default HandwrittenNote;

import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  type: {
    type: String, // e.g., 'text', 'markdown', 'code'
    default: "text",
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

const File = mongoose.models.File || mongoose.model("File", fileSchema);

export default File;

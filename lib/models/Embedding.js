import mongoose from "mongoose";

// Define metadata as a subdocument schema
const metadataSchema = new mongoose.Schema(
  {
    title: { type: String },
    category: { type: String },
    topic: { type: String },
    type: { type: String },
    week: { type: Number },
  },
  { _id: false } // Don't create _id for subdocument
);

const embeddingSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // 768-dimensional vector for Gemini embedding model
      required: true,
    },
    metadata: {
      type: metadataSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for material lookups
embeddingSchema.index({ materialId: 1, chunkIndex: 1 });

// Note: Vector search index must be created in MongoDB Atlas UI
// Index name: embedding_index
// Configuration:
// {
//   "mappings": {
//     "fields": {
//       "embedding": {
//         "type": "knnVector",
//         "dimensions": 768,
//         "similarity": "cosine"
//       }
//     }
//   }
// }

const Embedding =
  mongoose.models.Embedding || mongoose.model("Embedding", embeddingSchema);

export default Embedding;

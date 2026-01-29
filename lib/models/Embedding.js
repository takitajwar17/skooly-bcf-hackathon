import mongoose from "mongoose";

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
      type: [Number], // 768-dimensional vector for Gemini text-embedding-004
      required: true,
    },
    metadata: {
      title: String,
      category: String,
      topic: String,
      type: String,
      week: Number,
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

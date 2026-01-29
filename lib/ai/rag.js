import { generateEmbedding } from "./gemini";
import { chunkText } from "../parsers/fileParser";
import Embedding from "../models/Embedding";
import Material from "../models/Material";
import connectDB from "../mongodb/mongoose";

/**
 * Create embeddings for a material document
 * @param {string} materialId - The material's ObjectId
 * @param {string} content - Text content to embed
 * @param {object} metadata - Material metadata
 * @returns {Promise<number>} - Number of chunks created
 */
export async function createEmbeddings(materialId, content, metadata) {
  await connectDB();

  // Chunk the content
  const chunks = chunkText(content);

  if (chunks.length === 0) {
    console.warn("No chunks created for material:", materialId);
    return 0;
  }

  // Generate embeddings for each chunk
  const embeddingDocs = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      const embedding = await generateEmbedding(chunk);

      embeddingDocs.push({
        materialId,
        chunkIndex: i,
        content: chunk,
        embedding,
        metadata: {
          title: metadata.title,
          category: metadata.category,
          topic: metadata.topic,
          type: metadata.type,
          week: metadata.week,
        },
      });
    } catch (error) {
      console.error(`Error generating embedding for chunk ${i}:`, error);
    }
  }

  // Bulk insert embeddings
  if (embeddingDocs.length > 0) {
    await Embedding.insertMany(embeddingDocs);
  }

  return embeddingDocs.length;
}

/**
 * Semantic search using MongoDB Atlas Vector Search
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>} - Search results with scores
 */
export async function semanticSearch(query, options = {}) {
  const { limit = 5, category = null, minScore = 0.5 } = options;

  await connectDB();

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Build filter for category if specified
  const filter = category ? { "metadata.category": category } : {};

  // MongoDB Atlas Vector Search aggregation
  const pipeline = [
    {
      $vectorSearch: {
        index: "embedding_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: limit * 2, // Get more candidates for filtering
        filter: filter,
      },
    },
    {
      $project: {
        materialId: 1,
        content: 1,
        metadata: 1,
        chunkIndex: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
    {
      $match: {
        score: { $gte: minScore },
      },
    },
    {
      $limit: limit,
    },
  ];

  const results = await Embedding.aggregate(pipeline);

  // Populate material details
  const enrichedResults = await Promise.all(
    results.map(async (result) => {
      const material = await Material.findById(result.materialId).select(
        "title category topic type week fileUrl",
      );
      return {
        ...result,
        material,
      };
    }),
  );

  return enrichedResults;
}

/**
 * Get relevant context for RAG
 * @param {string} query - User query
 * @param {object} options - Search options
 * @returns {Promise<{context: string, sources: Array}>} - Context string and source materials
 */
export async function getRAGContext(query, options = {}) {
  const results = await semanticSearch(query, options);

  if (results.length === 0) {
    return { context: "", sources: [] };
  }

  // Build context string
  const contextParts = results.map((result, index) => {
    const source = result.material
      ? `[${result.material.title}]`
      : `[Source ${index + 1}]`;
    return `${source}:\n${result.content}`;
  });

  const context = contextParts.join("\n\n---\n\n");

  // Extract unique source materials
  const sources = results
    .filter((r) => r.material)
    .map((r) => ({
      id: r.materialId,
      title: r.material.title,
      category: r.material.category,
      topic: r.material.topic,
      score: r.score,
    }));

  // Deduplicate sources by id
  const uniqueSources = sources.filter(
    (source, index, self) =>
      index === self.findIndex((s) => s.id.toString() === source.id.toString()),
  );

  return { context, sources: uniqueSources };
}

/**
 * Delete embeddings for a material
 * @param {string} materialId - The material's ObjectId
 */
export async function deleteEmbeddings(materialId) {
  await connectDB();
  await Embedding.deleteMany({ materialId });
}

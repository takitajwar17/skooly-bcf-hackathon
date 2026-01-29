import { generateEmbedding, generateQueryEmbedding } from "./embedding";
import { chunkText, isFileUrlContent, extractFileUrl, FILE_URL_PREFIX } from "../parsers/fileParser";
import Embedding from "../models/Embedding";
import Material from "../models/Material";
import connectDB from "../mongodb/mongoose";

/**
 * Create embeddings for a material document
 * Handles both text content and file URLs (when parsing fails)
 * @param {string} materialId - The material's ObjectId
 * @param {string} content - Text content or FILE_URL: prefixed URL
 * @param {object} metadata - Material metadata (title, category, topic, type, week, fileUrl)
 * @returns {Promise<number>} - Number of chunks created
 */
export async function createEmbeddings(materialId, content, metadata) {
  await connectDB();

  // Check if content is a file URL (parsing failed, fallback to Gemini file processing)
  const hasFileUrl = isFileUrlContent(content);
  const fileUrl = hasFileUrl ? extractFileUrl(content) : metadata.fileUrl;

  let chunks;
  let embeddingContent;

  if (hasFileUrl) {
    // For file URLs, create a single chunk with metadata description for embedding
    // The actual file will be read by Gemini at query time
    embeddingContent = `${metadata.title} - ${metadata.topic} (${metadata.category}, Week ${metadata.week})`;
    chunks = [embeddingContent];
    console.log("Creating metadata-based embedding for file URL:", fileUrl);
  } else {
    // Normal text content - chunk it
    chunks = chunkText(content);
  }

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
        content: hasFileUrl ? content : chunk, // Store file URL content as-is for later processing
        embedding,
        metadata: {
          title: metadata.title,
          category: metadata.category,
          topic: metadata.topic,
          type: metadata.type,
          week: metadata.week,
          fileUrl: fileUrl || null, // Store fileUrl for file-based RAG
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

  // Generate query embedding using RETRIEVAL_QUERY task type for better search accuracy
  const queryEmbedding = await generateQueryEmbedding(query);

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
 * Handles both text content and file URLs (for Gemini file processing)
 * @param {string} query - User query
 * @param {object} options - Search options
 * @returns {Promise<{context: string, sources: Array, fileUrls: Array}>} - Context string, source materials, and file URLs
 */
export async function getRAGContext(query, options = {}) {
  const results = await semanticSearch(query, options);

  if (results.length === 0) {
    return { context: "", sources: [], fileUrls: [] };
  }

  // Separate text content from file URLs
  const textParts = [];
  const fileUrls = [];

  results.forEach((result, index) => {
    const source = result.material
      ? `[${result.material.title}]`
      : `[Source ${index + 1}]`;
    
    // Check if content is a file URL
    if (isFileUrlContent(result.content)) {
      const url = extractFileUrl(result.content);
      if (url) {
        fileUrls.push({
          url,
          title: result.material?.title || `Source ${index + 1}`,
          type: result.metadata?.type || result.material?.type || 'pdf',
          materialId: result.materialId,
        });
      }
    } else {
      // Regular text content
      textParts.push(`${source}:\n${result.content}`);
    }
  });

  const context = textParts.join("\n\n---\n\n");

  // Extract unique source materials
  const sources = results
    .filter((r) => r.material)
    .map((r) => ({
      id: r.materialId,
      title: r.material.title,
      category: r.material.category,
      topic: r.material.topic,
      type: r.material.type,
      fileUrl: r.material.fileUrl,
      score: r.score,
    }));

  // Deduplicate sources by id
  const uniqueSources = sources.filter(
    (source, index, self) =>
      index === self.findIndex((s) => s.id.toString() === source.id.toString()),
  );

  return { context, sources: uniqueSources, fileUrls };
}

/**
 * Delete embeddings for a material
 * @param {string} materialId - The material's ObjectId
 */
export async function deleteEmbeddings(materialId) {
  await connectDB();
  await Embedding.deleteMany({ materialId });
}

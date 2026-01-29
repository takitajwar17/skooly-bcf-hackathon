import { GoogleGenAI } from "@google/genai";

// Initialize the Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * Create a FileSearchStore for course materials
 * @param {string} displayName - Display name for the store
 * @returns {Promise<Object>} - Created FileSearchStore
 */
export async function createFileSearchStore(displayName) {
  try {
    const store = await ai.fileSearchStores.create({
      config: { displayName },
    });
    console.log(`✓ Created FileSearchStore: ${store.name}`);
    return store;
  } catch (error) {
    console.error("Failed to create FileSearchStore:", error);
    throw error;
  }
}

/**
 * Upload file directly to FileSearchStore
 * Handles automatic chunking, embedding, and indexing
 * @param {string} filePath - Path to file (local or URL)
 * @param {string} fileSearchStoreName - Name of the FileSearchStore
 * @param {string} displayName - Display name for the file (used in citations)
 * @returns {Promise<Object>} - Operation result with documentId
 */
export async function uploadToFileSearchStore(
  filePath,
  fileSearchStoreName,
  displayName,
) {
  try {
    console.log(`Uploading to FileSearchStore: ${displayName}`);

    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: filePath,
      fileSearchStoreName,
      config: { displayName },
    });

    // Wait for indexing to complete
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max wait

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      operation = await ai.operations.get({ operation });
      attempts++;
    }

    if (!operation.done) {
      throw new Error("File indexing timeout - operation did not complete");
    }

    console.log(`✓ File indexed successfully: ${displayName}`);
    return operation;
  } catch (error) {
    console.error(`Failed to upload file to FileSearchStore:`, error);
    throw error;
  }
}

/**
 * List all FileSearchStores
 * @returns {Promise<Array>} - List of FileSearchStores
 */
export async function listFileSearchStores() {
  try {
    const stores = await ai.fileSearchStores.list();
    return stores;
  } catch (error) {
    console.error("Failed to list FileSearchStores:", error);
    throw error;
  }
}

/**
 * Get a specific FileSearchStore
 * @param {string} name - FileSearchStore name
 * @returns {Promise<Object>} - FileSearchStore details
 */
export async function getFileSearchStore(name) {
  try {
    const store = await ai.fileSearchStores.get({ name });
    return store;
  } catch (error) {
    console.error("Failed to get FileSearchStore:", error);
    throw error;
  }
}

/**
 * Delete a FileSearchStore
 * @param {string} name - FileSearchStore name
 */
export async function deleteFileSearchStore(name) {
  try {
    await ai.fileSearchStores.delete({ name });
    console.log(`✓ Deleted FileSearchStore: ${name}`);
  } catch (error) {
    console.error("Failed to delete FileSearchStore:", error);
    throw error;
  }
}

/**
 * Delete a document from FileSearchStore
 * @param {string} fileSearchStoreName - FileSearchStore name
 * @param {string} documentId - Document ID to delete
 */
export async function deleteFileSearchDocument(
  fileSearchStoreName,
  documentId,
) {
  try {
    await ai.fileSearchStores.deleteDocument({
      name: fileSearchStoreName,
      documentId,
    });
    console.log(`✓ Deleted document from FileSearchStore: ${documentId}`);
  } catch (error) {
    console.error("Failed to delete document from FileSearchStore:", error);
    throw error;
  }
}

/**
 * Search using FileSearch tool
 * @param {string} query - Search query
 * @param {string} fileSearchStoreName - FileSearchStore name
 * @param {string} mode - "search" or "rag"
 * @param {string} model - Gemini model to use (default: gemini-2.5-flash-lite)
 * @returns {Promise<Object>} - Response with text and citations
 */
export async function searchWithFileSearch(
  query,
  fileSearchStoreName,
  mode = "rag",
  model = "gemini-2.5-flash-lite",
) {
  try {
    console.log("\n=== FileSearch Query ===");
    console.log("Query:", query);
    console.log("Store:", fileSearchStoreName);
    console.log("Mode:", mode);
    console.log("Model:", model);

    // Different prompts for search vs RAG
    const prompt =
      mode === "search"
        ? `Find relevant documents about: ${query}\n\nReturn only the document excerpts that match, do not generate new content.`
        : query;

    console.log("Actual Prompt:", prompt);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [fileSearchStoreName],
            },
          },
        ],
      },
    });

    console.log("\n=== FileSearch Response ===");
    console.log("Response Text Length:", response.text?.length || 0);
    console.log(
      "Response Text Preview:",
      response.text?.substring(0, 200) || "No text",
    );

    // Extract citations from groundingMetadata
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations = groundingChunks.map((chunk, idx) => {
      const context = chunk.retrievedContext || {};
      return {
        id: `citation-${idx}`,
        source: context.fileSearchStore || fileSearchStoreName,
        title: context.title || `Document ${idx + 1}`,
        text: context.text || "",
        snippet: context.text?.substring(0, 500) || "",
        metadata: context,
      };
    });

    console.log("\n=== Citations ===");
    console.log("Grounding Chunks Count:", groundingChunks.length);
    console.log("Citations Count:", citations.length);

    if (citations.length > 0) {
      citations.forEach((citation, idx) => {
        console.log(`\nCitation ${idx + 1}:`);
        console.log("  Title:", citation.title);
        console.log("  Source:", citation.source);
        console.log(
          "  Text Preview:",
          citation.text?.substring(0, 100) || "N/A",
        );
      });
    } else {
      console.log("⚠️  No citations found - FileSearchStore may be empty!");
      console.log(
        "   Make sure files were uploaded AFTER setting FILE_SEARCH_STORE_NAME",
      );
    }

    console.log("\n=== Metadata ===");
    console.log(
      "Grounding Metadata:",
      JSON.stringify(
        response.candidates?.[0]?.groundingMetadata || {},
        null,
        2,
      ),
    );

    console.log("\n=== Full Response Object ===");
    console.log(JSON.stringify(response, null, 2));
    console.log("========================\n");

    return {
      text: response.text,
      citations: citations,
      metadata: response.candidates?.[0]?.groundingMetadata || {},
    };
  } catch (error) {
    console.error("\n=== FileSearch Error ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("========================\n");
    throw error;
  }
}

export default ai;

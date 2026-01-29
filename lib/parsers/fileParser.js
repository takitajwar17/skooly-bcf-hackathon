import mammoth from "mammoth";
import fs from "fs/promises";

/**
 * Extracts text content from various file types
 * @param {string} filePath - Path to the file on disk
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text content
 */
export const parseFile = async (filePath, mimeType) => {
  try {
    if (mimeType === "application/pdf") {
      try {
        // Use require for pdf-parse to avoid ESM issues
        const pdfParse = require("pdf-parse");
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer, {
          // Disable canvas rendering to avoid DOM issues
          max: 0,
          version: 'v1.10.100'
        });
        return data.text;
      } catch (pdfError) {
        console.warn("PDF parsing failed, treating as binary:", pdfError.message);
        // Fallback: return filename and basic info
        return `PDF file: ${filePath.split('/').pop()}\n[Content extraction failed - PDF parsing requires server-side canvas support]`;
      }
    } 
    
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const dataBuffer = await fs.readFile(filePath);
      const data = await mammoth.extractRawText({ buffer: dataBuffer });
      return data.value;
    }

    if (
      mimeType.startsWith("text/") || 
      mimeType === "application/javascript" || 
      mimeType === "application/x-javascript" ||
      mimeType === "application/json"
    ) {
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    }

    // Default for unknown types (try reading as text if possible)
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error parsing file:", error);
    return "";
  }
};

/**
 * Chunk text into smaller pieces for embedding
 * @param {string} text - Text to chunk
 * @param {number} maxChunkSize - Maximum characters per chunk
 * @param {number} overlap - Overlap between chunks
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, maxChunkSize = 2000, overlap = 200) {
  if (!text || text.length === 0) {
    return [];
  }

  // Detect if content is likely code based on common patterns
  const isCode = /^(import|export|function|class|const|let|var|def|public|private)/m.test(text);
  
  if (isCode) {
    return chunkCode(text, maxChunkSize);
  }

  // If text is smaller than chunk size, return as single chunk
  if (text.length <= maxChunkSize) {
    return [text.trim()];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;

    if (end < text.length) {
      // Try to break at paragraph boundary
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + maxChunkSize / 2) {
        end = paragraphBreak;
      } else {
        // Try to break at sentence boundary
        const sentenceEnd = text.lastIndexOf(". ", end);
        if (sentenceEnd > start + maxChunkSize / 2) {
          end = sentenceEnd + 1;
        }
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}

/**
 * Syntax-aware chunking for code files
 * Attempts to break chunks at logical boundaries (functions, classes)
 */
function chunkCode(text, maxChunkSize = 2000) {
  const chunks = [];
  const lines = text.split("\n");
  let currentChunk = "";

  // Common code structure patterns
  const patterns = [
    /^(export\s+)?(class|function|async\s+function|def|struct|interface|enum|type)\s+/, // Top-level definitions
    /^const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/, // Arrow functions
    /^(public|private|protected)\s+/, // Classes in Java/C++/TS
  ];

  for (const line of lines) {
    // If line starts a new block and we're nearing the chunk limit, start a new chunk
    const isNewBlock = patterns.some((p) => p.test(line));

    if (
      isNewBlock &&
      currentChunk.length > maxChunkSize * 0.5 &&
      (currentChunk.length + line.length > maxChunkSize ||
        currentChunk.split("\n").length > 40)
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }

    currentChunk += line + "\n";

    // Absolute hard limit for very long files/functions
    if (currentChunk.length > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

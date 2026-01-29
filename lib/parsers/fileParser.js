import pdf from "pdf-parse";
import mammoth from "mammoth";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Parse a file and extract its text content
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Extracted text content
 */
export async function parseFile(filePath, mimeType) {
  const extension = path.extname(filePath).toLowerCase();

  try {
    switch (extension) {
      case ".pdf":
        return await parsePDF(filePath);
      case ".docx":
        return await parseDocx(filePath);
      case ".txt":
      case ".md":
        return await parseText(filePath);
      case ".js":
      case ".jsx":
      case ".ts":
      case ".tsx":
      case ".py":
      case ".java":
      case ".c":
      case ".cpp":
      case ".h":
      case ".css":
      case ".html":
      case ".json":
      case ".sql":
        return await parseCode(filePath, extension);
      default:
        // Try to read as text
        return await parseText(filePath);
    }
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

/**
 * Parse PDF file
 */
async function parsePDF(filePath) {
  const buffer = await readFile(filePath);
  const data = await pdf(buffer);
  return data.text.trim();
}

/**
 * Parse DOCX file
 */
async function parseDocx(filePath) {
  const buffer = await readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

/**
 * Parse plain text file
 */
async function parseText(filePath) {
  const content = await readFile(filePath, "utf-8");
  return content.trim();
}

/**
 * Parse code file with language detection
 */
async function parseCode(filePath, extension) {
  const content = await readFile(filePath, "utf-8");
  const languageMap = {
    ".js": "javascript",
    ".jsx": "javascript (react)",
    ".ts": "typescript",
    ".tsx": "typescript (react)",
    ".py": "python",
    ".java": "java",
    ".c": "c",
    ".cpp": "c++",
    ".h": "c/c++ header",
    ".css": "css",
    ".html": "html",
    ".json": "json",
    ".sql": "sql",
  };

  const language = languageMap[extension] || "code";
  return `[Language: ${language}]\n\n${content.trim()}`;
}

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

  // Detect if content is likely code based on prefix [Language: ...]
  if (text.startsWith("[Language:")) {
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
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + maxChunkSize / 2) {
        end = paragraphBreak;
      } else {
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
export function chunkCode(text, maxChunkSize = 2000) {
  const chunks = [];
  const lines = text.split("\n");
  let currentChunk = "";

  // Common code structure patterns
  const patterns = [
    /^(export\s+)?(class|function|async\s+function|def|struct|interface|enum|type)\s+/, // Top-level definitions
    /^const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/, // Arrow functions
    /^public\s+|private\s+|protected\s+/, // Classes in Java/C++/TS
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

/**
 * Get file type based on extension
 */
export function getFileType(filename) {
  const extension = path.extname(filename).toLowerCase();
  const typeMap = {
    ".pdf": "pdf",
    ".docx": "pdf",
    ".doc": "pdf",
    ".pptx": "lecture",
    ".ppt": "lecture",
    ".txt": "notes",
    ".md": "notes",
    ".js": "code",
    ".jsx": "code",
    ".ts": "code",
    ".tsx": "code",
    ".py": "code",
    ".java": "code",
    ".c": "code",
    ".cpp": "code",
    ".h": "code",
    ".html": "code",
    ".css": "code",
    ".sql": "code",
  };
  return typeMap[extension] || "reference";
}

/**
 * Get MIME type based on extension
 */
export function getMimeType(filename) {
  const extension = path.extname(filename).toLowerCase();
  const mimeMap = {
    ".pdf": "application/pdf",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".js": "application/javascript",
    ".jsx": "application/javascript",
    ".ts": "application/typescript",
    ".tsx": "application/typescript",
    ".py": "text/x-python",
    ".java": "text/x-java",
    ".c": "text/x-c",
    ".cpp": "text/x-c++",
    ".h": "text/x-c",
    ".html": "text/html",
    ".css": "text/css",
    ".json": "application/json",
    ".sql": "application/sql",
  };
  return mimeMap[extension] || "application/octet-stream";
}

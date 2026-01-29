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

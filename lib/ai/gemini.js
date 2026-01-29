import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error("❌ GOOGLE_API_KEY is missing in environment variables!");
} else {
  console.log(`✅ Gemini API Key loaded (${apiKey.substring(0, 4)}...)`);
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

export const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});

/**
 * Generate embeddings for a given text
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Generate a generic response from Gemini
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

/**
 * Generate theory content based on a topic and context
 * @param {string} topic
 * @param {string} context
 * @returns {Promise<string>}
 */
export async function generateTheoryContent(topic, context = "") {
  const prompt = `
    You are an expert educational content creator.
    Create a comprehensive theory lesson on the topic: "${topic}".
    
    ${context ? `Use the following context to ground your answer:\n${context}\n` : ""}
    
    Structure the content with:
    1. Introduction (What is it?)
    2. Key Concepts (Core principles)
    3. Detailed Explanation (How it works)
    4. Real-world Applications
    5. Summary
    
    Use Markdown formatting with headers (##), bullet points, and code blocks where appropriate.
    Keep the tone engaging and educational.
  `;

  return generateResponse(prompt);
}

/**
 * Generate a lab exercise based on a topic and language
 * @param {string} topic
 * @param {string} language
 * @param {string} context
 * @returns {Promise<string>}
 */
export async function generateLabContent(topic, language, context = "") {
  const prompt = `
    You are an expert programming instructor.
    Create a hands-on lab exercise for the topic: "${topic}" using ${language}.
    
    ${context ? `Use the following context to ground your answer:\n${context}\n` : ""}
    
    Structure the content with:
    1. Lab Objective
    2. Prerequisites
    3. Step-by-Step Instructions
    4. Code Starter/Boilerplate
    5. Expected Output
    6. Challenge/Extension Task
    
    Use Markdown formatting with clear code blocks.
  `;

  return generateResponse(prompt);
}

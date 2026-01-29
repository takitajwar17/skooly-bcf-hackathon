import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Chat/Generation model - Gemini 1.5 Flash for speed
export const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Embedding model for vector search
export const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

/**
 * Generate text embedding using Gemini
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 */
export async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate chat response with context
 * @param {string} prompt - User prompt
 * @param {string} context - RAG context from materials
 * @param {Array} history - Previous conversation messages
 * @returns {Promise<string>} - Generated response
 */
export async function generateResponse(prompt, context = "", history = []) {
  const systemPrompt = `You are Skooly, an AI learning assistant for university courses. 
You help students understand course materials, answer questions, and generate learning content.
Always be helpful, accurate, and cite sources when using provided context.

${context ? `CONTEXT FROM COURSE MATERIALS:\n${context}\n\n` : ""}
Use the context above to answer the student's question. If the answer isn't in the context, say so.`;

  const chat = chatModel.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "I understand. I'm Skooly, ready to help with course materials.",
          },
        ],
      },
      ...history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    ],
  });

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

/**
 * Generate streaming chat response
 * @param {string} prompt - User prompt
 * @param {string} context - RAG context
 * @param {Array} history - Conversation history
 * @returns {AsyncGenerator} - Streaming response
 */
export async function* generateStreamingResponse(
  prompt,
  context = "",
  history = [],
) {
  const systemPrompt = `You are Skooly, an AI learning assistant for university courses.
Always be helpful, accurate, and cite sources when using provided context.

${context ? `CONTEXT FROM COURSE MATERIALS:\n${context}\n\n` : ""}`;

  const chat = chatModel.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Ready to help!" }],
      },
      ...history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    ],
  });

  const result = await chat.sendMessageStream(prompt);

  for await (const chunk of result.stream) {
    yield chunk.text();
  }
}

/**
 * Generate theory content (notes, summaries)
 * @param {string} topic - Topic to generate content for
 * @param {string} context - RAG context from materials
 * @returns {Promise<string>} - Generated markdown content
 */
export async function generateTheoryContent(topic, context = "") {
  const prompt = `Generate comprehensive study notes on: "${topic}"

${context ? `Use this course material as reference:\n${context}\n\n` : ""}

Format the notes with:
- Clear headings and subheadings
- Bullet points for key concepts
- Examples where applicable
- Summary at the end

Output in clean Markdown format.`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate lab/code content
 * @param {string} topic - Programming topic
 * @param {string} language - Programming language
 * @param {string} context - RAG context
 * @returns {Promise<string>} - Generated code with explanation
 */
export async function generateLabContent(
  topic,
  language = "python",
  context = "",
) {
  const prompt = `Generate a complete code example for: "${topic}" in ${language}

${context ? `Reference material:\n${context}\n\n` : ""}

Include:
1. Brief explanation of the concept
2. Complete, working code with comments
3. Example usage/output
4. Common pitfalls to avoid

Output in Markdown with proper code blocks.`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}

export default genAI;

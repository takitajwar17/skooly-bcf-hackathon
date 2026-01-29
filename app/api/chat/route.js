import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb/mongoose";
import ChatHistory from "@/lib/models/ChatHistory";
import Material from "@/lib/models/Material";
import { searchWithFileSearch } from "@/lib/ai/fileSearchStore";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Detect intent from message
function detectIntent(message) {
  const lowerMsg = message.toLowerCase();

  // Generate theory request
  if (
    /\b(generate|create|make|write).*(theory|notes|study guide|flashcards|revision|concept)\b/i.test(
      lowerMsg,
    ) ||
    /\b(theory|notes|study guide|flashcards|revision).*(generate|create|make|write)\b/i.test(
      lowerMsg,
    )
  ) {
    return "generate-theory";
  }

  // Generate lab/code request
  if (
    /\b(generate|create|make|write).*(lab|code|program|example|practice|implementation)\b/i.test(
      lowerMsg,
    ) ||
    /\b(lab|code|program|example|practice).*(generate|create|make|write)\b/i.test(
      lowerMsg,
    )
  ) {
    return "generate-lab";
  }

  // Summary request
  if (
    /\b(summarize|summary|give me a summary|tldr|tl;dr|brief|overview|key points)\b/i.test(
      lowerMsg,
    )
  ) {
    return "summarize";
  }

  // Explanation request
  if (
    /\b(explain|what is|what are|how does|how do|why does|why do|tell me about|describe|definition|meaning)\b/i.test(
      lowerMsg,
    )
  ) {
    return "explain";
  }

  // Material search - user wants files/materials only
  if (
    /\b(find|search|show|give|get|list|any|where|materials?|files?|documents?|pdfs?|slides?|notes?|lectures?|resources?)\b/i.test(
      lowerMsg,
    ) &&
    !/\b(explain|summary|summarize|what is|how does|generate|create)\b/i.test(
      lowerMsg,
    )
  ) {
    return "search";
  }

  // Chitchat
  if (/^(hi|hello|hey|thanks|thank you|bye|goodbye)/i.test(lowerMsg.trim())) {
    return "chitchat";
  }

  // Default to general Q&A with RAG
  return "explain";
}

// Get system prompt based on intent
function getSystemPrompt(intent) {
  switch (intent) {
    case "generate-theory":
      return `You are Skooly, an expert AI learning assistant.
Your task is to GENERATE comprehensive study notes/theory content.

Guidelines:
- Create well-structured study notes with clear headings
- Include key definitions and concepts
- Add bullet points for important facts
- Include examples where helpful
- Make it exam-ready and easy to revise
- Use markdown formatting for clarity`;

    case "generate-lab":
      return `You are Skooly, an expert AI coding assistant.
Your task is to GENERATE practical code examples and lab content.

Guidelines:
- Provide working code examples with comments
- Explain the logic step by step
- Include input/output examples
- Add common pitfalls to avoid
- Make code beginner-friendly
- Use proper code formatting with language tags`;

    case "summarize":
      return `You are Skooly, an expert AI learning assistant. 
Your task is to SUMMARIZE the content concisely and clearly.

Guidelines:
- Use bullet points for key concepts
- Keep it structured with clear sections
- Highlight the most important takeaways
- Be brief but comprehensive
- Include only essential information`;

    case "explain":
      return `You are Skooly, an expert AI learning assistant.
Your task is to EXPLAIN the concept clearly and thoroughly.

Guidelines:
- Start with a simple definition or overview
- Break down complex ideas step by step
- Use analogies and examples where helpful
- Make it easy to understand for students
- Connect it to related concepts if relevant`;

    default:
      return `You are Skooly, an expert AI learning assistant.
Answer the student's question accurately and helpfully using the course materials.`;
  }
}

// Find materials by searching FileSearch and matching to DB
async function findMaterials(query, limit = 5) {
  const fileSearchStoreName = process.env.FILE_SEARCH_STORE_NAME;
  if (!fileSearchStoreName) return [];

  try {
    const result = await searchWithFileSearch(
      query,
      fileSearchStoreName,
      "search",
    );
    const citations = result.citations || [];

    if (citations.length === 0) return [];

    const titles = [...new Set(citations.map((c) => c.title).filter(Boolean))];

    const materials = await Material.find({
      $or: titles.slice(0, 10).map((title) => ({
        title: {
          $regex: title.split(" - ")[0].substring(0, 30),
          $options: "i",
        },
      })),
    })
      .select("title course category topic week fileUrl type")
      .limit(limit * 2); // Get more to filter

    // Filter by relevance - check if query keywords appear in title/topic/category
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const filtered = materials.filter((m) => {
      const searchText =
        `${m.title} ${m.topic || ""} ${m.category || ""}`.toLowerCase();
      return queryWords.some((word) => searchText.includes(word));
    });

    // If no filtered results, return original (might be a follow-up query)
    return filtered.length > 0
      ? filtered.slice(0, limit)
      : materials.slice(0, limit);
  } catch (error) {
    console.error("Error finding materials:", error);
    return [];
  }
}

// Generate chitchat response
async function generateChitchatResponse(message) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are Skooly, a friendly AI learning assistant. Respond briefly to: ${message}`,
          },
        ],
      },
    ],
  });
  return response.text;
}

// Generate RAG response with specialized prompt and conversation context
async function generateRAGResponse(
  query,
  intent,
  fileSearchStoreName,
  conversationHistory = [],
) {
  const systemPrompt = getSystemPrompt(intent);

  // Build context from recent conversation
  let contextText = "";
  if (conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-6); // Last 3 exchanges
    contextText = recentMessages
      .map(
        (m) =>
          `${m.role === "user" ? "Student" : "Assistant"}: ${m.content.substring(0, 300)}`,
      )
      .join("\n");
    contextText = `\nRecent conversation:\n${contextText}\n\n`;
  }

  // Add instruction to focus on specific file if mentioned
  const focusInstruction = `IMPORTANT: If the student mentions a specific file or document name, focus ONLY on that specific file. Do not include content from other files.`;

  const fullPrompt = `${systemPrompt}\n\n${focusInstruction}${contextText}Student's current question: ${query}`;

  const result = await searchWithFileSearch(
    fullPrompt,
    fileSearchStoreName,
    "rag",
  );
  return {
    text: result.text,
    citations: result.citations || [],
  };
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { message, chatId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Get or create chat session
    let chat;
    if (chatId) {
      chat = await ChatHistory.findOne({ _id: chatId, userId });
    }

    if (!chat) {
      chat = new ChatHistory({
        userId,
        title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        messages: [],
      });
    }

    // Add user message
    chat.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Detect intent
    const intent = detectIntent(message);
    console.log("Chat: Intent detected:", intent);

    let aiResponse = "";
    let relevantFiles = [];

    const fileSearchStoreName = process.env.FILE_SEARCH_STORE_NAME;

    if (intent === "search") {
      // MATERIAL SEARCH: Just return files, no explanation
      console.log("Chat: Material search mode");
      relevantFiles = await findMaterials(message, 5);

      if (relevantFiles.length > 0) {
        // Include file titles in response for follow-up context
        const filesList = relevantFiles.map((f) => f.title).join(", ");
        aiResponse = `Found ${relevantFiles.length} relevant material${relevantFiles.length > 1 ? "s" : ""}: ${filesList}`;
      } else {
        aiResponse =
          "I couldn't find any materials matching your search. Try different keywords or check the materials page.";
      }
    } else if (intent === "chitchat") {
      // CHITCHAT: Simple response
      console.log("Chat: Chitchat mode");
      aiResponse = await generateChitchatResponse(message);
    } else if (
      intent === "summarize" ||
      intent === "explain" ||
      intent === "generate-theory" ||
      intent === "generate-lab"
    ) {
      // SUMMARIZE, EXPLAIN, or GENERATE: RAG response with specialized prompt
      console.log("Chat:", intent, "mode");

      if (!fileSearchStoreName) {
        return NextResponse.json(
          { error: "FileSearchStore not configured" },
          { status: 500 },
        );
      }

      const result = await generateRAGResponse(
        message,
        intent,
        fileSearchStoreName,
        chat.messages,
      );
      aiResponse = result.text;

      // Find relevant files to show as sources
      if (result.citations.length > 0) {
        const titles = [
          ...new Set(result.citations.map((c) => c.title).filter(Boolean)),
        ];
        relevantFiles = await Material.find({
          $or: titles.slice(0, 5).map((title) => ({
            title: {
              $regex: title.split(" - ")[0].substring(0, 30),
              $options: "i",
            },
          })),
        })
          .select("title course category topic week fileUrl type")
          .limit(3);
      }
    } else {
      // Default Q&A with RAG
      console.log("Chat: General Q&A mode");

      if (!fileSearchStoreName) {
        return NextResponse.json(
          { error: "FileSearchStore not configured" },
          { status: 500 },
        );
      }

      const result = await generateRAGResponse(
        message,
        "explain",
        fileSearchStoreName,
        chat.messages,
      );
      aiResponse = result.text;

      if (result.citations.length > 0) {
        const titles = [
          ...new Set(result.citations.map((c) => c.title).filter(Boolean)),
        ];
        relevantFiles = await Material.find({
          $or: titles.slice(0, 5).map((title) => ({
            title: {
              $regex: title.split(" - ")[0].substring(0, 30),
              $options: "i",
            },
          })),
        })
          .select("title course category topic week fileUrl type")
          .limit(3);
      }
    }

    // Save assistant message
    chat.messages.push({
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    });

    await chat.save();

    // Build response
    const responseData = {
      success: true,
      chatId: chat._id,
      response: aiResponse,
      intent,
    };

    if (relevantFiles.length > 0) {
      responseData.relevantFiles = relevantFiles.map((file) => ({
        id: file._id,
        title: file.title,
        course: file.course,
        category: file.category,
        topic: file.topic,
        week: file.week,
        type: file.type,
        fileUrl: file.fileUrl,
      }));
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Chat failed" },
      { status: 500 },
    );
  }
}

// GET - Get chat history
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (chatId) {
      const chat = await ChatHistory.findOne({ _id: chatId, userId });
      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
      return NextResponse.json({ chat });
    } else {
      const chats = await ChatHistory.find({ userId })
        .select("title createdAt updatedAt")
        .sort({ updatedAt: -1 })
        .limit(50);
      return NextResponse.json({ chats });
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a chat
export async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID required" }, { status: 400 });
    }

    await ChatHistory.deleteOne({ _id: chatId, userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 },
    );
  }
}

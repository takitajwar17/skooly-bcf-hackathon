import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb/mongoose";
import ChatHistory from "@/lib/models/ChatHistory";
import { getRAGContext } from "@/lib/ai/rag";
import { generateResponse } from "@/lib/ai/embedding";

// POST - Send a message and get AI response
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

    // Get RAG context for the question (now includes fileUrls for file-based RAG)
    const { context, sources, fileUrls } = await getRAGContext(message, { limit: 5 });

    // Build conversation history for context (last 10 messages)
    const recentHistory = chat.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Generate AI response with both text context and file URLs
    // Gemini will read files directly for better understanding of PDFs and documents
    const aiResponse = await generateResponse(
      message,
      context,
      recentHistory.slice(0, -1), // Exclude the just-added user message
      fileUrls, // Pass file URLs for Gemini to process
    );

    // Add assistant message
    chat.messages.push({
      role: "assistant",
      content: aiResponse,
      sources: sources.map((s) => s.id),
      timestamp: new Date(),
    });

    await chat.save();

    return NextResponse.json({
      success: true,
      chatId: chat._id,
      response: aiResponse,
      sources: sources.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        topic: s.topic,
        fileUrl: s.fileUrl,
      })),
      filesProcessed: fileUrls.length,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}

// GET - Get chat history for a user
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
      // Get specific chat
      const chat = await ChatHistory.findOne({ _id: chatId, userId });
      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
      return NextResponse.json({ chat });
    } else {
      // Get all chats (summary only)
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

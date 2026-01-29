import { NextResponse } from "next/server";
import { getRAGContext, semanticSearch } from "@/lib/ai/rag";
import { generateResponse } from "@/lib/ai/gemini";
import connectDB from "@/lib/mongodb/mongoose";

export async function POST(request) {
  try {
    await connectDB();

    const { query, category, mode = "search" } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Mode: "search" for just results, "rag" for AI-augmented response
    if (mode === "search") {
      // Simple semantic search - return matching chunks
      const results = await semanticSearch(query, { category, limit: 10 });

      return NextResponse.json({
        success: true,
        results: results.map((r) => ({
          id: r._id,
          content: r.content,
          score: r.score,
          material: r.material
            ? {
                id: r.material._id,
                title: r.material.title,
                category: r.material.category,
                topic: r.material.topic,
                type: r.material.type,
                week: r.material.week,
                fileUrl: r.material.fileUrl,
              }
            : null,
        })),
      });
    } else {
      // RAG mode - generate AI response with context
      const { context, sources } = await getRAGContext(query, {
        category,
        limit: 5,
      });

      if (!context) {
        return NextResponse.json({
          success: true,
          response:
            "I couldn't find any relevant information in the course materials. Please try a different query or check if materials have been uploaded.",
          sources: [],
        });
      }

      const response = await generateResponse(query, context);

      return NextResponse.json({
        success: true,
        response,
        sources,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

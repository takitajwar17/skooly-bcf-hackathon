import { NextResponse } from "next/server";
import { searchWithFileSearch } from "@/lib/ai/fileSearchStore";
import connectDB from "@/lib/mongodb/mongoose";

export async function POST(request) {
  try {
    console.log("\n========== SEARCH API CALLED ==========");
    await connectDB();

    const { query, mode = "rag" } = await request.json();
    console.log("Request Body:", { query, mode });

    if (!query) {
      console.log("ERROR: No query provided");
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const fileSearchStoreName = process.env.FILE_SEARCH_STORE_NAME;
    console.log("FileSearchStore Name:", fileSearchStoreName);

    if (!fileSearchStoreName) {
      console.log("ERROR: FILE_SEARCH_STORE_NAME not configured");
      return NextResponse.json(
        { error: "FileSearchStore not configured" },
        { status: 500 },
      );
    }

    console.log("Calling searchWithFileSearch...");
    // Use Gemini FileSearch tool for both search and RAG modes
    const result = await searchWithFileSearch(query, fileSearchStoreName, mode);

    console.log("\n=== Search API Result ===");
    console.log("Result Text Length:", result.text?.length || 0);
    console.log("Result Citations Count:", result.citations?.length || 0);
    if (result.stats) {
      console.log("Filtering Stats:", result.stats);
      console.log(`  - Retrieved: ${result.stats.totalRetrieved} documents`);
      console.log(
        `  - Showing: ${result.stats.relevantShown} relevant (${result.stats.filterRate})`,
      );
    }

    if (mode === "search") {
      console.log("Mode: SEARCH - Returning structured results");
      const searchResults = {
        success: true,
        citations: result.citations.map((citation, idx) => ({
          id: citation.id || `citation-${idx}`,
          title: citation.title || `Document ${idx + 1}`,
          text: citation.text || "",
          snippet: citation.text?.substring(0, 150) || "",
          source: citation.source || fileSearchStoreName,
          metadata: citation.metadata || {},
        })),
        response: result.text,
      };
      console.log("Search Results Count:", searchResults.citations.length);
      console.log("========================================\n");
      return NextResponse.json(searchResults);
    } else {
      console.log("Mode: RAG - Returning AI response with citations");
      const ragResponse = {
        success: true,
        response: result.text,
        citations: result.citations,
        metadata: result.metadata,
      };
      console.log("========================================\n");
      return NextResponse.json(ragResponse);
    }
  } catch (error) {
    console.error("\n========== SEARCH API ERROR ==========");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("======================================\n");
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 },
    );
  }
}

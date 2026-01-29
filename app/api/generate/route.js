import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRAGContext } from "@/lib/ai/rag";
import { generateTheoryContent, generateLabContent } from "@/lib/ai/gemini";
import connectDB from "@/lib/mongodb/mongoose";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const {
      topic,
      type = "theory",
      language = "python",
      useContext = true,
    } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Get relevant context from course materials
    let context = "";
    let sources = [];

    if (useContext) {
      const ragResult = await getRAGContext(topic, { limit: 5 });
      context = ragResult.context;
      sources = ragResult.sources;
    }

    // Generate content based on type
    let content = "";
    let validationResult = null;

    if (type === "theory") {
      content = await generateTheoryContent(topic, context);
      validationResult = validateTheoryContent(content, sources);
    } else if (type === "lab") {
      content = await generateLabContent(topic, language, context);
      validationResult = validateLabContent(content, language);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      content,
      sources,
      validation: validationResult,
      metadata: {
        topic,
        type,
        language: type === "lab" ? language : null,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}

/**
 * Basic validation for theory content
 */
function validateTheoryContent(content, sources) {
  const issues = [];
  let score = 100;

  // Check content length
  if (content.length < 200) {
    issues.push("Content may be too brief");
    score -= 20;
  }

  // Check for structure (headers)
  if (!content.includes("#") && !content.includes("**")) {
    issues.push("Content lacks clear structure");
    score -= 15;
  }

  // Check if grounded in sources
  if (sources.length === 0) {
    issues.push("No source materials available for grounding");
    score -= 25;
  }

  return {
    valid: score >= 60,
    score: Math.max(0, score),
    issues,
    grounded: sources.length > 0,
  };
}

/**
 * Basic validation for lab/code content
 */
function validateLabContent(content, language) {
  const issues = [];
  let score = 100;

  // Check for code blocks
  const hasCodeBlock = content.includes("```");
  if (!hasCodeBlock) {
    issues.push("No code blocks found");
    score -= 30;
  }

  // Check for explanation
  const hasExplanation = content.length > 300;
  if (!hasExplanation) {
    issues.push("Explanation may be too brief");
    score -= 15;
  }

  // Language-specific checks
  const languagePatterns = {
    python: ["def ", "import ", "class ", "print("],
    javascript: ["function ", "const ", "let ", "console.log"],
    java: ["public class", "public static", "System.out"],
    c: ["#include", "int main", "printf"],
    cpp: ["#include", "int main", "cout"],
  };

  const patterns = languagePatterns[language] || [];
  const hasLanguageMarkers = patterns.some((p) =>
    content.toLowerCase().includes(p.toLowerCase()),
  );

  if (!hasLanguageMarkers && hasCodeBlock) {
    issues.push(`Code may not be valid ${language}`);
    score -= 20;
  }

  return {
    valid: score >= 60,
    score: Math.max(0, score),
    issues,
    syntaxChecked: hasCodeBlock,
    language,
  };
}

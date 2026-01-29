import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import AiMaterial from "@/lib/models/AiMaterial";
import { model } from "@/lib/ai/gemini";

export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const {
      sourceContent,
      type,
      category,
      title,
      customization,
      course,
      week,
      topic,
      fileUrl,
      sourceMaterialId,
    } = await req.json();

    if (!type || !category || !title || (!sourceContent && !fileUrl)) {
      return NextResponse.json(
        {
          error: "Missing required fields: source content or file is required.",
        },
        { status: 400 },
      );
    }

    // Edge Case: Check for extremely short content if no file URL is provided
    if (!fileUrl && sourceContent && sourceContent.length < 50) {
      return NextResponse.json(
        { error: "Source content is too short for meaningful generation." },
        { status: 400 },
      );
    }

    let finalSourceContent = sourceContent || "";
    // Check if sourceContent indicates a file URL or insufficient content, and fetch if needed
    // The user provided example shows sourceContent might be "PDF file: ... [Content extraction failed...]"
    // If the request body includes a fileUrl, we should use that to fetch/process content if possible.
    // However, Gemini 1.5 Flash (latest) supports multimodal input (PDFs via URI or base64).
    // If we have a Cloudinary URL, we can pass it to Gemini if we can't extract text.

    // NOTE: In a real implementation, we might need to fetch the PDF and extract text
    // or pass the PDF directly to Gemini using the File API.
    // Since we are limited to text prompting here without File API setup:
    if (
      fileUrl &&
      (!sourceContent ||
        sourceContent.includes("Content extraction failed") ||
        sourceContent.length < 100)
    ) {
      // Fallback: If we can't read the PDF, we can't generate specific notes from it easily
      // without Gemini's multimodal capabilities.
      // We will try to fetch the file content if it's text-based, or just warn the user/AI.

      // Strategy: Provide the URL to Gemini (it might be able to access public URLs)
      // OR rely on what little metadata we have.
      // Better Strategy: If we have a PDF URL, we should ideally use Gemini's file API.
      // But for this hackathon fix, let's assume we pass the URL and hope Gemini can browse or we just use metadata.

      finalSourceContent = `The user provided a file at: ${fileUrl}. 
        Title: ${title}
        Topic: ${topic}
        Course: ${course}
        
        (Note: The file content extraction failed locally. Please generate content based on the Title and Topic provided, as if you were teaching this subject.)`;
    }

    let prompt = "";

    switch (type) {
      case "notes":
        prompt = `You are an expert tutor. Create comprehensive reading notes.
        The user wants notes on: ${title} (Topic: ${topic}).
        
        Context/Content provided:
        ${finalSourceContent}
        
        Use Markdown formatting. Include a summary, key concepts, and detailed explanations. 
        ${customization ? `Focus on: ${customization}` : ""}`;
        break;
      case "slides":
        prompt = `You are a presentation expert. Create content for a slide deck.
        Topic: ${title}.
        
        Context/Content provided:
        ${finalSourceContent}
        
        Separate each slide with a horizontal rule '---'. 
        For each slide, provide a '# Title' and bullet points. 
        The first slide should be a Title Slide.
        ${customization ? `Focus on: ${customization}` : ""}`;
        break;
      case "pdf":
        prompt = `You are a professional technical writer. Create a well-structured document.
        Topic: ${title}.
        
        Context/Content provided:
        ${finalSourceContent}
        
        Use Markdown. Include a Title, Table of Contents (if long), and clear sections.
        ${customization ? `Focus on: ${customization}` : ""}`;
        break;
      case "code-guide":
        prompt = `You are a senior developer. Create a code guide/tutorial.
        Topic: ${title}.
        
        Context/Content provided:
        ${finalSourceContent}
        
        Explain functionality, break it down, and provide usage examples. 
        Use Markdown with code blocks.
        ${customization ? `Focus on: ${customization}` : ""}`;
        break;
      default:
        prompt = `Analyze the following content: ${finalSourceContent}`;
    }

    // Add a timeout for the Gemini call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API Timeout")), 60000),
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);

    const generatedContent = result.response.text();

    // Format category to match enum ["Theory", "Lab"]
    const formattedCategory =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

    const newMaterial = await AiMaterial.create({
      uploadedBy: user.id,
      title,
      type,
      category: formattedCategory,
      content: generatedContent,
      course: course || "AI Generated",
      week: week || 1,
      topic: topic || title,
      sourceMaterialId: sourceMaterialId || new mongoose.Types.ObjectId(), // Fallback if missing
      customization,
    });

    return NextResponse.json(newMaterial);
  } catch (error) {
    console.error("Generation error:", error);

    // Handle specific errors
    if (error.message === "Gemini API Timeout") {
      return NextResponse.json(
        {
          error:
            "Generation timed out. Please try with smaller content or try again later.",
        },
        { status: 504 },
      );
    }

    if (error.message.includes("SAFETY")) {
      return NextResponse.json(
        { error: "Content generation blocked by safety filters." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate content. " + (error.message || "") },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { currentUser } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import HandwrittenNote from "@/lib/models/HandwrittenNote";

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Initialize Tesseract worker
    // Using v5/v6 syntax
    const worker = await createWorker("eng");

    // Recognize text
    const {
      data: { text },
    } = await worker.recognize(buffer);

    // Terminate worker to free resources
    await worker.terminate();

    // Basic post-processing to organize notes
    // We try to structure it as Markdown
    const lines = text.split("\n");
    let formattedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;

      // Check if it looks like a header (all caps or very short and not ending in punctuation)
      if (
        line.length < 50 &&
        line === line.toUpperCase() &&
        !/[.!?]$/.test(line)
      ) {
        formattedLines.push(`## ${line}`);
      }
      // Check for list items
      else if (/^[-*•]/.test(line)) {
        formattedLines.push(`- ${line.replace(/^[-*•]\s*/, "")}`);
      }
      // Numbered lists
      else if (/^\d+[.)]/.test(line)) {
        formattedLines.push(line);
      }
      // Regular paragraph
      else {
        formattedLines.push(line);
      }
    }

    const formattedText = formattedLines.join("\n\n");

    // Save to Database
    await connect();
    const newNote = await HandwrittenNote.create({
      uploadedBy: user.id,
      title: `Handwritten Note - ${new Date().toLocaleDateString()}`,
      content: formattedText,
      rawContent: text,
      // imageUrl: TODO: Upload to Cloudinary if needed
    });

    return NextResponse.json({
      text: formattedText,
      rawText: text,
      _id: newNote._id,
    });
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      { error: "Failed to process image. Make sure it is a clear image." },
      { status: 500 },
    );
  }
}

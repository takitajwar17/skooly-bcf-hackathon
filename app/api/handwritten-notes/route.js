import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import HandwrittenNote from "@/lib/models/HandwrittenNote";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const course = formData.get("course");
    const topic = formData.get("topic");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Generate content using Gemini Vision
    const prompt =
      "Transcribe the handwritten notes in this image into clear, formatted Markdown text. " +
      "Ignore any stray marks or noise. " +
      "Structure the output with appropriate headers, bullet points, and paragraphs. " +
      "Do not include any conversational preamble, just the transcribed content.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const text = result.response.text();
    const formattedText = text; // Gemini already formats it nicely

    // Save to Database
    await connect();
    const newNote = await HandwrittenNote.create({
      uploadedBy: user.id,
      title: `Handwritten Note - ${new Date().toLocaleDateString()}`,
      content: formattedText,
      rawContent: text,
      course: course || "General",
      topic: topic || "Uncategorized",
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

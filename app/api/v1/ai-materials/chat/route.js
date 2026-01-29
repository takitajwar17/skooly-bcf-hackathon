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

    const { materialId, message, history } = await req.json();

    const material = await AiMaterial.findOne({
      _id: materialId,
      uploadedBy: user.id,
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }

    // Limit history to last 10 messages to prevent context overflow
    const recentHistory = history.slice(-10);

    // Construct history for Gemini
    const chatHistory = recentHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `You are a helpful study assistant. 
          The user is studying the following material:
          
          Title: ${material.title}
          Content: ${material.content}
          
          Answer questions specifically about this material.`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "Understood. I am ready to help you study this material." },
          ],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);

    // Handle specific errors
    if (error.message.includes("SAFETY")) {
      return NextResponse.json(
        { error: "Response blocked by safety filters." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate response. " + (error.message || "") },
      { status: 500 },
    );
  }
}

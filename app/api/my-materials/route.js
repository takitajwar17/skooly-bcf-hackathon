import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import AiMaterial from "@/lib/models/AiMaterial";
import HandwrittenNote from "@/lib/models/HandwrittenNote";

export async function GET(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    // Fetch AI Materials
    const aiMaterials = await AiMaterial.find({ uploadedBy: user.id })
      .select("title type category createdAt course topic")
      .lean();

    // Fetch Handwritten Notes
    const handwrittenNotes = await HandwrittenNote.find({ uploadedBy: user.id })
      .select("title createdAt course topic")
      .lean();

    // Normalize and Merge
    const normalizedAi = aiMaterials.map((item) => ({
      _id: item._id,
      title: item.title,
      type: "ai-note",
      subType: item.type, // 'notes', 'slides', 'mcq', etc.
      category: item.category,
      createdAt: item.createdAt,
      metadata: {
        course: item.course,
        topic: item.topic,
      },
    }));

    const normalizedHandwritten = handwrittenNotes.map((item) => ({
      _id: item._id,
      title: item.title,
      type: "handwritten",
      subType: "handwritten",
      createdAt: item.createdAt,
      metadata: {
        course: item.course,
        topic: item.topic,
      },
    }));

    const unifiedList = [...normalizedAi, ...normalizedHandwritten].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return NextResponse.json(unifiedList);
  } catch (error) {
    console.error("Unified Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

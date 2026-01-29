import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";

// GET - List materials with optional filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const topic = searchParams.get("topic");
    const week = searchParams.get("week");
    const tag = searchParams.get("tag");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const page = parseInt(searchParams.get("page")) || 1;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (topic) filter.topic = { $regex: topic, $options: "i" };
    if (week) filter.week = parseInt(week);
    if (tag) filter.tags = tag;

    // Get total count
    const total = await Material.countDocuments(filter);

    // Get materials with pagination
    const materials = await Material.find(filter)
      .select("-content -filePath") // Exclude large fields
      .sort({ week: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      materials,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 },
    );
  }
}

// POST - Create a material (text-only, no file upload)
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    const material = await Material.create({
      title: data.title,
      description: data.description || "",
      category: data.category || "theory",
      type: data.type || "notes",
      topic: data.topic || "General",
      week: data.week || 1,
      tags: data.tags || [],
      content: data.content || "",
      uploadedBy: userId,
    });

    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 },
    );
  }
}

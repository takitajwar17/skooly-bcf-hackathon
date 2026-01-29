import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";

/**
 * GET /api/materials
 * List all materials with optional filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const week = searchParams.get("week");
    const topic = searchParams.get("topic");

    console.log("API: Materials request received");
    
    // Add timeout wrapper
    const connectWithTimeout = Promise.race([
      connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    await connectWithTimeout;
    console.log("API: Database connected");

    let query = {};
    if (category) query.category = category;
    if (week) query.week = parseInt(week);
    if (topic) query.topic = { $regex: topic, $options: "i" };

    console.log("Fetching materials with query:", query);

    const materials = await Material.find(query)
      .select("-content")
      .sort({ week: 1, createdAt: -1 })
      .maxTimeMS(5000);

    return NextResponse.json({ data: materials });
  } catch (error) {
    console.error("Materials API error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch materials",
      details: error.name === 'MongoTimeoutError' ? 'Database connection timeout' : undefined
    }, { status: 500 });
  }
}

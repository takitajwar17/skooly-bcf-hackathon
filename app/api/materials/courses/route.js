import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";

/**
 * GET /api/materials/courses
 * Returns a unique list of course names
 */
export async function GET() {
  try {
    // Add timeout wrapper
    const connectWithTimeout = Promise.race([
      connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    await connectWithTimeout;
    const courses = await Material.distinct("course").maxTimeMS(5000);
    return NextResponse.json({ data: courses.sort() });
  } catch (error) {
    console.error("Courses API error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch courses",
      details: error.name === 'MongoTimeoutError' ? 'Database connection timeout' : undefined
    }, { status: 500 });
  }
}

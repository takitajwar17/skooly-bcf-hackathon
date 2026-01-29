import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";
import Embedding from "@/lib/models/Embedding";
import Material from "@/lib/models/Material";

/**
 * GET /api/embeddings/stats
 * Check embedding statistics - which materials are vectorized
 */
export async function GET() {
  try {
    console.log("=== CHECKING EMBEDDING STATS ===");
    
    await connect();
    
    // Count total materials
    const totalMaterials = await Material.countDocuments();
    console.log(`Total materials: ${totalMaterials}`);
    
    // Count total embeddings
    const totalEmbeddings = await Embedding.countDocuments();
    console.log(`Total embeddings: ${totalEmbeddings}`);
    
    // Get unique material IDs that have embeddings
    const materialsWithEmbeddings = await Embedding.distinct("materialId");
    console.log(`Materials with embeddings: ${materialsWithEmbeddings.length}`);
    
    // Get all material IDs
    const allMaterials = await Material.find().select("_id title course topic");
    
    // Find materials without embeddings
    const materialsWithoutEmbeddings = allMaterials.filter(
      material => !materialsWithEmbeddings.some(
        embId => embId.toString() === material._id.toString()
      )
    );
    
    // Get embedding counts per material
    const embeddingCounts = await Embedding.aggregate([
      {
        $group: {
          _id: "$materialId",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "materials",
          localField: "_id",
          foreignField: "_id",
          as: "material"
        }
      },
      {
        $unwind: "$material"
      },
      {
        $project: {
          materialId: "$_id",
          title: "$material.title",
          course: "$material.course",
          topic: "$material.topic",
          embeddingCount: "$count"
        }
      },
      {
        $sort: { embeddingCount: -1 }
      }
    ]);
    
    console.log("=== STATS COMPLETE ===");
    
    return NextResponse.json({
      success: true,
      stats: {
        totalMaterials,
        totalEmbeddings,
        materialsWithEmbeddings: materialsWithEmbeddings.length,
        materialsWithoutEmbeddings: materialsWithoutEmbeddings.length,
        coverage: totalMaterials > 0 
          ? `${Math.round((materialsWithEmbeddings.length / totalMaterials) * 100)}%`
          : "0%",
      },
      materialsWithEmbeddings: embeddingCounts,
      materialsWithoutEmbeddings: materialsWithoutEmbeddings.map(m => ({
        id: m._id,
        title: m.title,
        course: m.course,
        topic: m.topic,
      })),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ 
      error: error.message,
      details: "Failed to fetch embedding statistics"
    }, { status: 500 });
  }
}


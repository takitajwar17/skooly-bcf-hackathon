import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";
import Embedding from "@/lib/models/Embedding";
import { createEmbeddings } from "@/lib/ai/rag";
import { isAdmin } from "@/lib/actions/user";

/**
 * POST /api/embeddings/backfill
 * Generate embeddings for existing materials that don't have them
 * Admin only - this can take a while for large datasets
 */
export async function POST(request) {
  try {
    console.log("=== STARTING EMBEDDING BACKFILL ===");
    
    // Check admin authorization
    const { userId } = await auth();
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    await connect();
    
    // Get optional filters from request body
    const body = await request.json().catch(() => ({}));
    const { materialIds = null, force = false } = body;
    
    // Build query
    let query = {};
    if (materialIds && Array.isArray(materialIds) && materialIds.length > 0) {
      query._id = { $in: materialIds };
      console.log(`Processing specific materials: ${materialIds.length}`);
    }
    
    // Get all materials matching query
    const materials = await Material.find(query);
    console.log(`Found ${materials.length} materials to process`);
    
    if (materials.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No materials found to process",
        results: {
          total: 0,
          processed: 0,
          skipped: 0,
          failed: 0,
        }
      });
    }
    
    const results = {
      total: materials.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      details: [],
    };
    
    for (const material of materials) {
      try {
        console.log(`\n--- Processing: ${material.title} (${material._id}) ---`);
        
        // Check if embeddings already exist (unless force=true)
        if (!force) {
          const existingCount = await Embedding.countDocuments({ 
            materialId: material._id 
          });
          
          if (existingCount > 0) {
            console.log(`  ⏭️  Skipped - already has ${existingCount} embeddings`);
            results.skipped++;
            results.details.push({
              materialId: material._id,
              title: material.title,
              status: "skipped",
              reason: `Already has ${existingCount} embeddings`,
            });
            continue;
          }
        } else {
          // Force mode - delete existing embeddings first
          const deleted = await Embedding.deleteMany({ materialId: material._id });
          if (deleted.deletedCount > 0) {
            console.log(`  🗑️  Deleted ${deleted.deletedCount} existing embeddings (force mode)`);
          }
        }
        
        // Check if material has content
        if (!material.content || material.content.trim().length === 0) {
          console.log(`  ⚠️  Skipped - no content to embed`);
          results.skipped++;
          results.details.push({
            materialId: material._id,
            title: material.title,
            status: "skipped",
            reason: "No content available",
          });
          continue;
        }
        
        console.log(`  📝 Content length: ${material.content.length} characters`);
        console.log(`  🔄 Creating embeddings...`);
        
        // Create embeddings (pass fileUrl for file-based RAG when content is a URL)
        const embeddingCount = await createEmbeddings(
          material._id,
          material.content,
          {
            title: material.title,
            category: material.category,
            topic: material.topic,
            type: material.type,
            week: material.week,
            fileUrl: material.fileUrl, // Pass fileUrl for file-based RAG
          }
        );
        
        console.log(`  ✅ Created ${embeddingCount} embedding chunks`);
        results.processed++;
        results.details.push({
          materialId: material._id,
          title: material.title,
          status: "success",
          embeddingCount,
        });
        
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        results.failed++;
        results.errors.push({
          materialId: material._id,
          title: material.title,
          error: error.message,
        });
        results.details.push({
          materialId: material._id,
          title: material.title,
          status: "failed",
          error: error.message,
        });
      }
    }
    
    console.log("\n=== BACKFILL COMPLETE ===");
    console.log(`Total: ${results.total}`);
    console.log(`Processed: ${results.processed}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);
    
    return NextResponse.json({
      success: true,
      message: `Backfill complete: ${results.processed} processed, ${results.skipped} skipped, ${results.failed} failed`,
      results,
    });
    
  } catch (error) {
    console.error("=== BACKFILL ERROR ===");
    console.error(error);
    return NextResponse.json({ 
      error: error.message,
      details: "Backfill process failed"
    }, { status: 500 });
  }
}

/**
 * GET /api/embeddings/backfill
 * Get backfill status/info (what needs to be processed)
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    await connect();
    
    // Get materials without embeddings
    const allMaterials = await Material.find().select("_id title course topic content");
    const materialsWithEmbeddings = await Embedding.distinct("materialId");
    
    const needsEmbeddings = allMaterials.filter(
      material => !materialsWithEmbeddings.some(
        embId => embId.toString() === material._id.toString()
      )
    );
    
    const needsEmbeddingsWithContent = needsEmbeddings.filter(
      m => m.content && m.content.trim().length > 0
    );
    
    return NextResponse.json({
      success: true,
      summary: {
        totalMaterials: allMaterials.length,
        withEmbeddings: materialsWithEmbeddings.length,
        needsEmbeddings: needsEmbeddings.length,
        needsEmbeddingsWithContent: needsEmbeddingsWithContent.length,
        cannotEmbed: needsEmbeddings.length - needsEmbeddingsWithContent.length,
      },
      materialsNeedingEmbeddings: needsEmbeddingsWithContent.map(m => ({
        id: m._id,
        title: m.title,
        course: m.course,
        topic: m.topic,
        contentLength: m.content?.length || 0,
      })),
    });
  } catch (error) {
    console.error("Backfill info error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


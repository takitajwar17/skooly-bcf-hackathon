import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import VideoMaterial from "@/lib/models/VideoMaterial";
import logger from "@/lib/logger";

/**
 * GET /api/videos/[id]/status
 * Check the status of a video generation operation
 * Used for polling by frontend to track generation progress
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Video status check attempted without authentication");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connect();

    logger.debug("Fetching video status", { userId, videoId: id });

    const videoMaterial = await VideoMaterial.findById(id).select(
      "status videoUrl errorMessage duration resolution aspectRatio generatedBy"
    );
    
    if (!videoMaterial) {
      logger.warn("Video not found for status check", { userId, videoId: id });
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (videoMaterial.generatedBy !== userId) {
      logger.warn("Unauthorized video status access attempt", {
        userId,
        videoId: id,
        ownerId: videoMaterial.generatedBy,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    logger.debug("Video status retrieved", {
      userId,
      videoId: id,
      status: videoMaterial.status,
    });

    return NextResponse.json({
      id: videoMaterial._id,
      status: videoMaterial.status,
      videoUrl: videoMaterial.videoUrl || null,
      error: videoMaterial.errorMessage || null,
      metadata: {
        duration: videoMaterial.duration,
        resolution: videoMaterial.resolution,
        aspectRatio: videoMaterial.aspectRatio,
      },
    });
  } catch (error) {
    logger.error("Error fetching video status", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

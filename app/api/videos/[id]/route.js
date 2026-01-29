import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import VideoMaterial from "@/lib/models/VideoMaterial";
import { deleteFromCloudinary } from "@/lib/cloudinary/upload";
import logger from "@/lib/logger";

/**
 * GET /api/videos/[id]
 * Retrieve complete video material information including metadata and source references
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Video retrieval attempted without authentication");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connect();

    logger.debug("Fetching video material", { userId, videoId: id });

    // Fetch video material - use lean() for proper JSON serialization
    const videoMaterial = await VideoMaterial.findById(id).lean();

    if (!videoMaterial) {
      logger.warn("Video not found", { userId, videoId: id });
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (videoMaterial.generatedBy !== userId) {
      logger.warn("Unauthorized video access attempt", {
        userId,
        videoId: id,
        ownerId: videoMaterial.generatedBy,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    logger.debug("Video material retrieved successfully", {
      userId,
      videoId: id,
      status: videoMaterial.status,
    });

    // Return as plain object (lean() already gives us this, but ensure serialization)
    return NextResponse.json(videoMaterial);
  } catch (error) {
    logger.error("Error retrieving video material", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/videos/[id]
 * Delete a video material and its associated Cloudinary file
 */
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Video deletion attempted without authentication");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connect();

    logger.info("Attempting to delete video", { userId, videoId: id });

    const videoMaterial = await VideoMaterial.findById(id);

    if (!videoMaterial) {
      logger.warn("Video not found for deletion", { userId, videoId: id });
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (videoMaterial.generatedBy !== userId) {
      logger.warn("Unauthorized video deletion attempt", {
        userId,
        videoId: id,
        ownerId: videoMaterial.generatedBy,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete from Cloudinary
    if (videoMaterial.cloudinaryPublicId) {
      try {
        logger.debug("Deleting video from Cloudinary", {
          videoId: id,
          cloudinaryPublicId: videoMaterial.cloudinaryPublicId,
        });
        await deleteFromCloudinary(videoMaterial.cloudinaryPublicId, "video");
        logger.info("Video deleted from Cloudinary", {
          videoId: id,
          cloudinaryPublicId: videoMaterial.cloudinaryPublicId,
        });
      } catch (err) {
        logger.error("Failed to delete video from Cloudinary", {
          error: err.message,
          videoId: id,
          cloudinaryPublicId: videoMaterial.cloudinaryPublicId,
        });
        // Continue to delete from DB even if Cloudinary deletion fails
      }
    }

    await VideoMaterial.findByIdAndDelete(id);

    logger.info("Video deleted successfully", { userId, videoId: id });

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting video", {
      error: error.message,
      stack: error.stack,
      videoId: id,
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

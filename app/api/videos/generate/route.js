import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import VideoMaterial from "@/lib/models/VideoMaterial";
import {
  generateVideoFromContent,
  generateVideo,
  pollVideoOperation,
  downloadVideo,
} from "@/lib/ai/video";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import logger from "@/lib/logger";

/**
 * POST - Generate video from course content
 * Creates a video using Veo 3.1 based on provided course content
 */
export async function POST(request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Video generation attempted without authentication");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connect();
    logger.debug("Database connection established for video generation", {
      userId,
    });

    // Parse request body
    const {
      content,
      topic,
      title,
      course,
      week,
      category,
      sourceMaterialId,
      sourceAiMaterialId,
      aspectRatio = "16:9",
      resolution = "720p",
      durationSeconds = "8",
      negativePrompt = "",
      style = "educational",
    } = await request.json();

    // Validate required fields
    if (!content || !topic || !title || !course) {
      logger.warn("Video generation attempted with missing required fields", {
        userId,
        hasContent: !!content,
        hasTopic: !!topic,
        hasTitle: !!title,
        hasCourse: !!course,
      });
      return NextResponse.json(
        { error: "Missing required fields: content, topic, title, and course are required" },
        { status: 400 },
      );
    }

    // Validate content length
    if (content.length < 50) {
      logger.warn("Video generation attempted with content too short", {
        userId,
        contentLength: content.length,
      });
      return NextResponse.json(
        { error: "Content is too short. Please provide at least 50 characters." },
        { status: 400 },
      );
    }

    logger.info("Starting video generation", {
      userId,
      topic,
      title,
      course,
      resolution,
      aspectRatio,
    });

    // Create video material record with pending status
    // Note: videoPrompt, videoUrl, and cloudinaryPublicId will be updated after generation completes
    let videoMaterial;
    try {
      videoMaterial = await VideoMaterial.create({
        title,
        topic,
        course,
        week: week || 1,
        category: category || "Theory",
        sourceContent: content,
        duration: parseInt(durationSeconds) || 8,
        resolution,
        aspectRatio,
        sourceMaterialId: sourceMaterialId || null,
        sourceAiMaterialId: sourceAiMaterialId || null,
        generatedBy: userId,
        status: "processing",
      });
      logger.debug("Video material record created", {
        videoId: videoMaterial._id,
        userId,
      });
    } catch (dbError) {
      logger.error("Error creating video material record", {
        error: dbError.message,
        stack: dbError.stack,
        userId,
      });
      throw new Error(`Failed to create video record: ${dbError.message}`);
    }

    // Progress callback for real-time updates
    const onProgress = async (progress) => {
      try {
        await VideoMaterial.findByIdAndUpdate(videoMaterial._id, {
          status: progress.status === "completed" ? "completed" : "processing",
        });
      } catch (error) {
        logger.error("Error updating video progress", {
          error: error.message,
          videoId: videoMaterial._id,
        });
      }
    };

    // Start generation in background (fire and forget)
    (async () => {
      try {
        // Generate video from content
        const videoData = await generateVideoFromContent(
          content,
          topic,
          {
            style,
            aspectRatio,
            resolution,
            durationSeconds,
            negativePrompt,
            onProgress,
          },
        );

        logger.info("Video generated successfully, uploading to Cloudinary", {
          userId,
          videoId: videoMaterial._id,
          videoSize: videoData.videoBuffer?.length || 0,
        });

        // Upload video to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
          Buffer.from(videoData.videoBuffer),
          `course_videos/${course}`,
          "video",
        );

        logger.info("Video uploaded to Cloudinary", {
          userId,
          videoId: videoMaterial._id,
          cloudinaryPublicId: cloudinaryResult.public_id,
        });

        // Update video material with final details
        await VideoMaterial.findByIdAndUpdate(
          videoMaterial._id,
          {
            videoUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            videoPrompt: videoData.prompt,
            operationName: videoData.operationName,
            status: "completed",
          },
        );

        logger.info("Video generation completed successfully", {
          userId,
          videoId: videoMaterial._id,
        });

      } catch (error) {
        logger.error("Error during background video generation", {
          error: error.message,
          stack: error.stack,
          userId,
          videoId: videoMaterial._id,
        });

        // Update video material with error status
        await VideoMaterial.findByIdAndUpdate(videoMaterial._id, {
          status: "failed",
          errorMessage: error.message,
        });
      }
    })();

    // Return immediately with pending status
    return NextResponse.json({
      success: true,
      video: videoMaterial,
      message: "Video generation started in background",
    });
  } catch (error) {
    logger.error("Unexpected error in video generation endpoint", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * GET - Get video generation status or list videos
 * Returns video status if operationName provided, otherwise lists user's videos
 */
export async function GET(request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Video list fetch attempted without authentication");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connect();
    logger.debug("Database connection established for video list fetch", {
      userId,
    });

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const operationName = searchParams.get("operationName");

    if (videoId) {
      // Get specific video
      const video = await VideoMaterial.findOne({
        _id: videoId,
        generatedBy: userId,
      });

      if (!video) {
        logger.warn("Video not found", { userId, videoId });
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      logger.debug("Video retrieved", { userId, videoId });
      return NextResponse.json({ video });
    } else if (operationName) {
      // Get video by operation name (for polling status)
      const video = await VideoMaterial.findOne({
        operationName,
        generatedBy: userId,
      });

      if (!video) {
        logger.warn("Video not found by operation name", {
          userId,
          operationName,
        });
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      logger.debug("Video retrieved by operation name", {
        userId,
        operationName,
      });
      return NextResponse.json({ video });
    } else {
      // List user's videos - optionally filter by sourceMaterialId
      const sourceMaterialId = searchParams.get("sourceMaterialId");
      const sourceAiMaterialId = searchParams.get("sourceAiMaterialId");
      
      const query = { generatedBy: userId };
      if (sourceMaterialId) {
        query.sourceMaterialId = sourceMaterialId;
      }
      if (sourceAiMaterialId) {
        query.sourceAiMaterialId = sourceAiMaterialId;
      }

      const videos = await VideoMaterial.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .select(
          "title topic course week category videoUrl duration resolution aspectRatio status createdAt sourceMaterialId sourceAiMaterialId errorMessage",
        );

      logger.info("Video list retrieved", {
        userId,
        videoCount: videos.length,
        sourceMaterialId,
        sourceAiMaterialId,
      });
      return NextResponse.json({ videos });
    }
  } catch (error) {
    logger.error("Error fetching videos", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

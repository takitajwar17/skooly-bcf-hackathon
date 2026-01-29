import { GoogleGenAI } from "@google/genai";
import logger from "@/lib/logger";

/**
 * Video generation utility using Veo 3.1 API
 * Converts course content into video summaries and explanatory clips
 */

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * Converts course content text into a video prompt suitable for Veo 3.1
 * Creates descriptive, cinematic prompts that work well for educational videos
 * 
 * @param {string} content - The course content to convert
 * @param {string} topic - The topic/subject of the content
 * @param {object} options - Additional options for prompt generation
 * @returns {Promise<string>} - A formatted video prompt
 */
export async function generateVideoPrompt(content, topic, options = {}) {
  const { style = "educational", duration = "8", includeAudio = true } = options;

  logger.debug("Generating video prompt from content", {
    topic,
    contentLength: content.length,
    style,
  });

  // Use Gemini to convert content into a video-friendly prompt
  const promptGenerationRequest = `You are an expert video script writer for educational content.

Convert the following course material into a detailed, cinematic video prompt for Veo 3.1 video generation.

Topic: ${topic}

Content:
${content.substring(0, 2000)}${content.length > 2000 ? "..." : ""}

Requirements:
- Create a vivid, visual description suitable for an ${style} video
- Include specific camera movements (e.g., "close-up", "wide shot", "panning")
- Describe visual elements clearly (colors, lighting, composition)
- ${includeAudio ? 'Include audio cues: dialogue, sound effects, or ambient sounds' : 'Focus on visual elements only'}
- Make it engaging and educational
- Keep it concise but descriptive (aim for 2-3 sentences)
- Use present tense and active voice

Return ONLY the video prompt, nothing else.`;

  try {
    // Generate content using the correct API format (matching codebase pattern)
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: promptGenerationRequest }] }],
    });

    // Extract text from response - matching pattern used in embedding.js
    const videoPrompt = response.text?.trim() || "";
    logger.info("Video prompt generated successfully", {
      topic,
      promptLength: videoPrompt.length,
    });

    return videoPrompt;
  } catch (error) {
    logger.error("Error generating video prompt", {
      error: error.message,
      topic,
    });
    // Fallback to a simple prompt if AI generation fails
    return `An educational video explaining ${topic}. Clear, professional presentation with visual aids and diagrams. ${includeAudio ? 'Narrated with clear, engaging voiceover.' : ''}`;
  }
}

/**
 * Generates a video using Veo 3.1
 * Handles async operation polling and video download
 * 
 * @param {string} prompt - The video generation prompt
 * @param {object} config - Video generation configuration
 * @returns {Promise<object>} - Operation object with video details
 */
export async function generateVideo(prompt, config = {}) {
  const {
    aspectRatio = "16:9",
    resolution = "720p",
    durationSeconds = "8",
    negativePrompt = "",
  } = config;

  // Convert durationSeconds to number if it's a string
  const durationSecondsNum = typeof durationSeconds === "string" 
    ? parseInt(durationSeconds, 10) 
    : durationSeconds;

  logger.info("Starting video generation", {
    promptPreview: prompt.substring(0, 100),
    aspectRatio,
    resolution,
    durationSeconds: durationSecondsNum,
  });

  try {
    // Start video generation operation
    const operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: prompt,
      config: {
        aspectRatio,
        resolution,
        durationSeconds: durationSecondsNum,
        ...(negativePrompt && { negativePrompt }),
      },
    });

    logger.debug("Video generation operation started", {
      operationName: operation.name,
    });

    return operation;
  } catch (error) {
    logger.error("Error starting video generation", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Polls video generation operation until completion
 * Checks status every 10 seconds until video is ready
 * 
 * @param {object} operation - The operation object from generateVideo
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<object>} - Completed operation with video response
 */
export async function pollVideoOperation(operation, onProgress = null) {
  logger.debug("Starting to poll video operation", {
    operationName: operation.name,
  });

  let currentOperation = operation;
  let pollCount = 0;
  const maxPolls = 60; // Maximum 10 minutes (60 * 10 seconds)

  while (!currentOperation.done && pollCount < maxPolls) {
    pollCount++;
    
    if (onProgress) {
      onProgress({
        status: "processing",
        pollCount,
        message: "Generating video... This may take a few minutes.",
      });
    }

    logger.debug("Polling video operation status", {
      operationName: currentOperation.name,
      pollCount,
      done: currentOperation.done,
    });

    // Wait 10 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Refresh operation status
    try {
      currentOperation = await ai.operations.getVideosOperation({
        operation: currentOperation,
      });
    } catch (error) {
      logger.error("Error polling video operation", {
        error: error.message,
        operationName: currentOperation.name,
      });
      throw error;
    }
  }

  if (!currentOperation.done) {
    const error = new Error("Video generation timed out after 10 minutes");
    logger.error("Video generation timeout", {
      operationName: currentOperation.name,
      pollCount,
    });
    throw error;
  }

  logger.info("Video generation completed", {
    operationName: currentOperation.name,
    pollCount,
  });

  if (onProgress) {
    onProgress({
      status: "completed",
      message: "Video generated successfully!",
    });
  }

  return currentOperation;
}

/**
 * Downloads video from operation response
 * Returns video buffer and metadata
 * 
 * @param {object} operation - Completed operation object
 * @returns {Promise<object>} - Video buffer and metadata
 */
export async function downloadVideo(operation) {
  if (!operation.done || !operation.response?.generatedVideos?.[0]) {
    throw new Error("Operation not completed or no video found");
  }

  const generatedVideo = operation.response.generatedVideos[0];
  logger.debug("Downloading generated video", {
    videoUri: generatedVideo.video?.uri,
  });

  try {
    // The JavaScript SDK's files.download() saves to a file path, not returns bytes
    // Instead, we need to fetch the video from the URI directly using the API key
    const videoUri = generatedVideo.video?.uri;
    
    if (!videoUri) {
      throw new Error("Video URI not found in operation response");
    }

    logger.debug("Fetching video from URI", { videoUri });

    // Fetch video directly from the URI with API key authentication
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY not configured");
    }

    // The URI from Veo API includes the download endpoint
    // We need to add the API key as a header
    const response = await fetch(videoUri, {
      headers: {
        "x-goog-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    // Get video as ArrayBuffer and convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const videoBytes = Buffer.from(arrayBuffer);
    
    logger.info("Video downloaded successfully", {
      videoSize: videoBytes.length,
      mimeType: response.headers.get("content-type") || "video/mp4",
    });

    return {
      videoBuffer: videoBytes,
      mimeType: generatedVideo.video.mimeType || response.headers.get("content-type") || "video/mp4",
      uri: videoUri,
    };
  } catch (error) {
    logger.error("Error downloading video", {
      error: error.message,
      stack: error.stack,
      videoUri: generatedVideo.video?.uri,
    });
    throw error;
  }
}

/**
 * Complete video generation workflow
 * Generates prompt, creates video, polls for completion, and downloads
 * 
 * @param {string} content - Course content to convert
 * @param {string} topic - Topic/subject
 * @param {object} options - Generation options
 * @returns {Promise<object>} - Video buffer and metadata
 */
export async function generateVideoFromContent(
  content,
  topic,
  options = {},
) {
  logger.info("Starting complete video generation workflow", {
    topic,
    contentLength: content.length,
  });

  try {
    // Step 1: Generate video prompt from content
    const videoPrompt = await generateVideoPrompt(content, topic, options);

    // Step 2: Generate video
    const operation = await generateVideo(videoPrompt, {
      aspectRatio: options.aspectRatio || "16:9",
      resolution: options.resolution || "720p",
      durationSeconds: options.durationSeconds || "8",
      negativePrompt: options.negativePrompt || "",
    });

    // Step 3: Poll until completion
    const completedOperation = await pollVideoOperation(
      operation,
      options.onProgress,
    );

    // Step 4: Download video
    const videoData = await downloadVideo(completedOperation);

    logger.info("Video generation workflow completed", {
      topic,
      videoSize: videoData.videoBuffer?.length || 0,
    });

    return {
      ...videoData,
      prompt: videoPrompt,
      operationName: completedOperation.name,
    };
  } catch (error) {
    logger.error("Video generation workflow failed", {
      error: error.message,
      topic,
    });
    throw error;
  }
}

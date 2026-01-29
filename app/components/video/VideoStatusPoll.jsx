"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { IconLoader, IconCheck, IconX, IconPlayerPlay } from "@tabler/icons-react";
import { Button } from "@/app/components/ui/button";
import VideoPlayer from "./VideoPlayer";

/**
 * VideoStatusPoll Component
 * Polls video generation status and displays progress/result
 * 
 * @param {object} props
 * @param {string} props.videoId - ID of the video to poll
 * @param {function} props.onComplete - Callback when video is completed
 * @param {number} props.pollInterval - Polling interval in milliseconds (default: 5000)
 */
export default function VideoStatusPoll({
  videoId,
  onComplete,
  pollInterval = 5000,
}) {
  const [status, setStatus] = useState("pending");
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!videoId || !isPolling) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}/status`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch video status");
        }

        const data = await response.json();
        setStatus(data.status);
        setVideoData(data);

        // Stop polling if video is completed or failed
        if (data.status === "completed" || data.status === "failed") {
          setIsPolling(false);
          if (data.status === "completed" && onComplete) {
            onComplete(data);
          }
        }
      } catch (err) {
        console.error("Error polling video status:", err);
        setError(err.message);
        setIsPolling(false);
      }
    };

    // Poll immediately, then at intervals
    pollStatus();
    const interval = setInterval(pollStatus, pollInterval);

    return () => clearInterval(interval);
  }, [videoId, pollInterval, isPolling, onComplete]);

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <IconLoader className="h-5 w-5 animate-spin text-primary" />;
      case "completed":
        return <IconCheck className="h-5 w-5 text-green-500" />;
      case "failed":
        return <IconX className="h-5 w-5 text-red-500" />;
      default:
        return <IconLoader className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "pending":
        return "Video generation is queued...";
      case "processing":
        return "Generating video... This may take a few minutes.";
      case "completed":
        return "Video generated successfully!";
      case "failed":
        return error || videoData?.error || "Video generation failed.";
      default:
        return "Unknown status";
    }
  };

  if (status === "completed" && videoData?.videoUrl) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon()}
              <div>
                <p className="font-semibold">{getStatusMessage()}</p>
                {videoData.metadata && (
                  <p className="text-sm text-muted-foreground">
                    {videoData.metadata.resolution} • {videoData.metadata.duration}s
                  </p>
                )}
              </div>
            </div>
            <VideoPlayer
              videoUrl={videoData.videoUrl}
              metadata={videoData.metadata}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="font-semibold">{getStatusMessage()}</p>
            {status === "processing" && (
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we generate your video...
              </p>
            )}
            {status === "failed" && error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
          <Badge
            variant={
              status === "completed"
                ? "default"
                : status === "failed"
                ? "destructive"
                : "secondary"
            }
          >
            {status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

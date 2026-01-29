"use client";

import { useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { IconDownload, IconPlayerPlay, IconPlayerPause, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { Badge } from "@/app/components/ui/badge";

/**
 * VideoPlayer Component
 * Displays generated videos with playback controls and metadata
 * 
 * @param {object} props
 * @param {string} props.videoUrl - URL of the video to play
 * @param {object} props.metadata - Video metadata (duration, resolution, aspectRatio)
 * @param {string} props.title - Video title
 * @param {string} props.className - Additional CSS classes
 */
export default function VideoPlayer({ videoUrl, metadata = {}, title, className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoRef, setVideoRef] = useState(null);

  if (!videoUrl) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No video available</p>
        </CardContent>
      </Card>
    );
  }

  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef) {
      videoRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const getDownloadUrl = (url) => {
    if (!url) return "#";
    if (url.includes("cloudinary.com")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
      }
    }
    return url;
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="relative w-full bg-black rounded-lg overflow-hidden group">
          {/* Video Element */}
          <video
            ref={setVideoRef}
            src={videoUrl}
            className="w-full h-auto max-h-[75vh]"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => {
              if (videoRef) {
                setIsMuted(videoRef.muted);
              }
            }}
          >
            Your browser does not support the video tag.
          </video>

          {/* Video Metadata Overlay */}
          {metadata && (metadata.duration || metadata.resolution) && (
            <div className="absolute top-4 right-4 flex gap-2">
              {metadata.resolution && (
                <Badge variant="secondary" className="bg-black/70 text-white border-none">
                  {metadata.resolution}
                </Badge>
              )}
              {metadata.duration && (
                <Badge variant="secondary" className="bg-black/70 text-white border-none">
                  {metadata.duration}s
                </Badge>
              )}
            </div>
          )}

          {/* Controls Overlay (shown on hover) */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-black/70 hover:bg-black/90 text-white border-none"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <IconPlayerPause className="h-4 w-4" />
                  ) : (
                    <IconPlayerPlay className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-black/70 hover:bg-black/90 text-white border-none"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? (
                    <IconVolumeOff className="h-4 w-4" />
                  ) : (
                    <IconVolume className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="bg-black/70 hover:bg-black/90 text-white border-none"
                asChild
              >
                <a href={getDownloadUrl(videoUrl)} download>
                  <IconDownload className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Video Info */}
        {title && (
          <div className="p-4 border-t">
            <h3 className="font-semibold text-sm">{title}</h3>
            {metadata.aspectRatio && (
              <p className="text-xs text-muted-foreground mt-1">
                Aspect Ratio: {metadata.aspectRatio}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

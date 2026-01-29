"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  IconChevronLeft,
  IconDownload,
  IconVideo,
  IconLoader,
  IconStack,
  IconClock,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import VideoPlayer from "@/app/components/video/VideoPlayer";
import VideoStatusPoll from "@/app/components/video/VideoStatusPoll";

/**
 * Video Detail Page
 * Displays a single video with full details and controls
 */
export default function VideoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVideo();
    }
  }, [id]);

  /**
   * Fetch video details from API
   */
  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/videos/${id}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      const json = await res.json();
      setVideo(json);
    } catch (error) {
      toast.error("Could not load video details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle video deletion
   */
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Video deleted successfully");
      router.push("/videos");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete video");
    }
  };

  /**
   * Get download URL for Cloudinary videos
   */
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

  if (loading) {
    return (
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 justify-center items-center">
            <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!video) {
    return (
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">Video not found.</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 text-muted-foreground hover:text-foreground transition-colors group"
                onClick={() => router.back()}
              >
                <IconChevronLeft className="size-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Videos
              </Button>
              {video.status === "completed" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-muted/50 rounded-2xl border border-muted shadow-inner">
                  <IconVideo className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-md uppercase text-[10px] font-bold tracking-wider px-2 border-primary/20 text-primary bg-primary/5"
                    >
                      Video
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-md text-[10px] font-medium px-2 bg-muted/50"
                    >
                      <IconStack className="size-3 mr-1" />
                      {video.course}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-md text-[10px] font-medium px-2 bg-muted/50"
                    >
                      <IconClock className="size-3 mr-1" />
                      Week {video.week}
                    </Badge>
                    {video.resolution && (
                      <Badge
                        variant="outline"
                        className="rounded-md text-[10px] font-medium px-2 bg-muted/50"
                      >
                        {video.resolution}
                      </Badge>
                    )}
                    {video.duration && (
                      <Badge
                        variant="outline"
                        className="rounded-md text-[10px] font-medium px-2 bg-muted/50"
                      >
                        {video.duration}s
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {video.title}
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed italic">
                    {video.topic}
                  </p>
                </div>
              </div>
              {video.status === "completed" && video.videoUrl && (
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none h-10 gap-2 shadow-none"
                    asChild
                  >
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                      <IconDownload className="size-4" />
                      Open Original
                    </a>
                  </Button>
                  <Button
                    className="flex-1 md:flex-none h-10 gap-2 shadow-none"
                    asChild
                  >
                    <a href={getDownloadUrl(video.videoUrl)}>
                      <IconDownload className="size-4" />
                      Download
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            {video.status === "completed" && video.videoUrl ? (
              <VideoPlayer
                videoUrl={video.videoUrl}
                metadata={{
                  duration: video.duration,
                  resolution: video.resolution,
                  aspectRatio: video.aspectRatio,
                }}
                title={video.title}
              />
            ) : video.status === "processing" || video.status === "pending" ? (
              <VideoStatusPoll
                videoId={video._id || video.id}
                onComplete={() => fetchVideo()}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-2">
                    Video generation {video.status === "failed" ? "failed" : "is pending"}.
                  </p>
                  {video.errorMessage && (
                    <p className="text-sm text-red-500 mt-2">{video.errorMessage}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Video Metadata */}
            {video.videoPrompt && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Generation Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{video.videoPrompt}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

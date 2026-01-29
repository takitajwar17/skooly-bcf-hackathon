"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Video, Plus, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/app/components/ui/skeleton";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import VideoPlayer from "@/app/components/video/VideoPlayer";
import VideoStatusPoll from "@/app/components/video/VideoStatusPoll";

/**
 * Videos Gallery Page
 * Displays all generated videos with status and playback
 */
export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  /**
   * Fetch all videos for the current user
   */
  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos/generate");
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error("Failed to fetch videos", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status icon based on video status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  /**
   * Get status badge variant
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-yellow-500">Processing</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Generated Videos</h1>
              <p className="text-muted-foreground mt-2">
                AI-generated video summaries and explanatory clips from your course materials
              </p>
            </div>
            <Button asChild>
              <Link href="/videos/new">
                <Plus className="mr-2 h-4 w-4" />
                Generate Video
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground mb-4">
                  No videos generated yet.
                </p>
                <Button asChild>
                  <Link href="/videos/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Your First Video
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card
                  key={video._id || video.id}
                  className="hover:shadow-lg transition-all"
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="p-2 bg-muted rounded-lg">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">
                        {video.title}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {video.course} • Week {video.week}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Show video player if completed */}
                    {video.status === "completed" && video.videoUrl ? (
                      <div className="mb-4">
                        <VideoPlayer
                          videoUrl={video.videoUrl}
                          metadata={{
                            duration: video.duration,
                            resolution: video.resolution,
                            aspectRatio: video.aspectRatio,
                          }}
                          title={video.title}
                        />
                      </div>
                    ) : video.status === "processing" || video.status === "pending" ? (
                      <div className="mb-4">
                        <VideoStatusPoll
                          videoId={video._id || video.id}
                          onComplete={() => fetchVideos()}
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center mb-4">
                        {getStatusIcon(video.status)}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      {getStatusBadge(video.status)}
                      {video.resolution && (
                        <Badge variant="outline">{video.resolution}</Badge>
                      )}
                      {video.duration && (
                        <Badge variant="outline">{video.duration}s</Badge>
                      )}
                      {video.aspectRatio && (
                        <Badge variant="outline">{video.aspectRatio}</Badge>
                      )}
                    </div>

                    {video.status === "failed" && video.errorMessage && (
                      <p className="text-sm text-red-500 mt-2">
                        {video.errorMessage}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(video.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href={`/videos/${video._id || video.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { IconVideo, IconLoader, IconCheck, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";

/**
 * VideoGenerationButton Component
 * Button and dialog for generating videos from course materials
 * 
 * @param {object} props
 * @param {object} props.material - Material object with content to convert
 * @param {function} props.onVideoGenerated - Callback when video is generated
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 */
export default function VideoGenerationButton({
  material,
  onVideoGenerated,
  variant = "default",
  size = "default",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: material?.title || "",
    topic: material?.topic || "",
    course: material?.course || "",
    week: material?.week || 1,
    category: material?.category || "Theory",
    resolution: "1080p",
    aspectRatio: "16:9",
    durationSeconds: "8",
    style: "educational",
  });

  const handleGenerate = async () => {
    if (!material?.content && !material?.fileUrl) {
      toast.error("No content available to generate video from");
      return;
    }

    setIsGenerating(true);

    try {
      // Extract content - use content field or fetch from fileUrl if needed
      let content = material.content || "";
      
      // If no content but has fileUrl, we'd need to fetch it
      // For now, we'll use a placeholder or the title/description
      if (!content && material.title) {
        content = `Educational content about ${material.title}. ${material.description || ""}`;
      }

      if (!content || content.length < 50) {
        toast.error("Content is too short. Please provide at least 50 characters.");
        setIsGenerating(false);
        return;
      }

      const response = await fetch("/api/videos/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          topic: formData.topic,
          title: formData.title,
          course: formData.course,
          week: formData.week,
          category: formData.category,
          sourceMaterialId: material._id || material.id,
          resolution: formData.resolution,
          aspectRatio: formData.aspectRatio,
          durationSeconds: formData.durationSeconds,
          style: formData.style,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start video generation");
      }

      const result = await response.json();
      
      toast.success("Video generation started! Check status in a few minutes.");
      setIsOpen(false);
      
      if (onVideoGenerated) {
        onVideoGenerated(result.video);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error(error.message || "Failed to start video generation");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <IconVideo className="h-4 w-4" />
          Generate Video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Video from Material</DialogTitle>
          <DialogDescription>
            Create an AI-generated video summary of this course material using Veo 3.1.
            Generation typically takes 2-5 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter video title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="Enter topic"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Input
                id="course"
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
                placeholder="Enter course name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="week">Week</Label>
              <Input
                id="week"
                type="number"
                value={formData.week}
                onChange={(e) =>
                  setFormData({ ...formData, week: parseInt(e.target.value) || 1 })
                }
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Lab">Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select
                value={formData.resolution}
                onValueChange={(value) =>
                  setFormData({ ...formData, resolution: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select
                value={formData.aspectRatio}
                onValueChange={(value) =>
                  setFormData({ ...formData, aspectRatio: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationSeconds">Duration (seconds)</Label>
              <Select
                value={formData.durationSeconds}
                onValueChange={(value) =>
                  setFormData({ ...formData, durationSeconds: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 seconds</SelectItem>
                  <SelectItem value="6">6 seconds</SelectItem>
                  <SelectItem value="8">8 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Video Style</Label>
            <Select
              value={formData.style}
              onValueChange={(value) =>
                setFormData({ ...formData, style: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="documentary">Documentary</SelectItem>
                <SelectItem value="animated">Animated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !formData.title ||
              !formData.topic ||
              !formData.course
            }
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <IconLoader className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconVideo className="h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

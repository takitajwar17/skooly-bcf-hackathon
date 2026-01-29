"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Loader2,
  BookOpen,
  Code,
  ArrowLeft,
  CheckCircle2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";

/**
 * New Video Generation Page
 * Allows users to generate videos from course materials using Veo 3.1
 * Follows the same flow as AI material generation
 */
export default function NewVideoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingMaterials, setFetchingMaterials] = useState(true);
  const [coursesData, setCoursesData] = useState({ theory: [], lab: [] });

  // Form State
  const [selectedCategory, setSelectedCategory] = useState("theory");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedSourceContent, setSelectedSourceContent] = useState("");
  const [selectedSourceTitle, setSelectedSourceTitle] = useState("");
  const [selectedSourceMetadata, setSelectedSourceMetadata] = useState({});

  // Video Configuration
  const [videoTitle, setVideoTitle] = useState("");
  const [videoTopic, setVideoTopic] = useState("");
  const [videoCourse, setVideoCourse] = useState("");
  const [videoWeek, setVideoWeek] = useState(1);
  const [resolution, setResolution] = useState("1080p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [durationSeconds, setDurationSeconds] = useState("8");
  const [style, setStyle] = useState("educational");
  const [customization, setCustomization] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, []);

  /**
   * Fetch available course materials to use as source for video generation
   */
  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/materials");
      const { data } = await res.json();

      // Group by category and course
      const grouped = { theory: [], lab: [] };

      const getCourse = (list, courseName) => {
        let course = list.find((c) => c.title === courseName);
        if (!course) {
          course = { id: courseName, title: courseName, materials: [] };
          list.push(course);
        }
        return course;
      };

      data.forEach((m) => {
        const cat = m.category?.toLowerCase() === "lab" ? "lab" : "theory";
        const course = getCourse(grouped[cat], m.course);
        course.materials.push({
          id: m._id,
          title: m.title,
          course: m.course,
          week: m.week,
          topic: m.topic,
        });
      });

      setCoursesData(grouped);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load materials");
    } finally {
      setFetchingMaterials(false);
    }
  };

  /**
   * Handle source material selection
   * Fetches full material details and populates form fields
   */
  const handleSourceSelect = async (materialSummary) => {
    // Optimistic update: Select immediately
    setSelectedSourceId(materialSummary.id);

    try {
      const res = await fetch(`/api/materials/${materialSummary.id}`);
      if (!res.ok) throw new Error("Failed to fetch material details");

      const material = await res.json();

      setSelectedSourceTitle(material.title);
      // Ensure content is set even if empty, but fileUrl might be present
      const content = material.content || "";
      const fileUrl = material.fileUrl || "";

      setSelectedSourceContent(content);
      setSelectedSourceMetadata({
        course: material.course,
        week: material.week,
        topic: material.topic,
        fileUrl: fileUrl,
        sourceMaterialId: material._id,
      });

      // Pre-populate video form fields
      setVideoTitle(`Video: ${material.title}`);
      setVideoTopic(material.topic || "");
      setVideoCourse(material.course || "");
      setVideoWeek(material.week || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load source content");
      // Revert selection on error
      setSelectedSourceId("");
      setSelectedSourceContent("");
      setSelectedSourceMetadata({});
    }
  };

  /**
   * Handle video generation submission
   * Validates form and calls the video generation API
   */
  const handleGenerate = async () => {
    // Validate required fields
    if (!videoTitle || !videoTopic || !videoCourse) {
      toast.error("Please fill in all required fields (Title, Topic, Course)");
      return;
    }

    // Check if we have either content or a file URL
    if (!selectedSourceContent && !selectedSourceMetadata.fileUrl) {
      toast.error("Please select a valid source material.");
      return;
    }

    // Use content or create a description from title/topic
    let content = selectedSourceContent;
    if (!content && selectedSourceTitle) {
      content = `Educational content about ${selectedSourceTitle}. Topic: ${videoTopic}`;
    }

    if (content.length < 50) {
      toast.error("Content is too short. Please select a material with more content.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoTitle,
          topic: videoTopic,
          course: videoCourse,
          week: videoWeek,
          category: selectedCategory === "theory" ? "Theory" : "Lab",
          content: content,
          sourceMaterialId: selectedSourceMetadata.sourceMaterialId,
          resolution: resolution,
          aspectRatio: aspectRatio,
          durationSeconds: durationSeconds,
          style: style,
          negativePrompt: customization ? `Avoid: ${customization}` : "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      toast.success("Video generation started! This may take a few minutes.");
      router.push(`/videos/${data.video._id}`);
    } catch (error) {
      toast.error(
        error.message || "Failed to start video generation. Please try again.",
      );
      console.error(error);
    } finally {
      setLoading(false);
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
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-w-4xl mx-auto w-full">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Videos
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Generate New Video</h1>
            <p className="text-muted-foreground mt-2">
              Step {step} of 2:{" "}
              {step === 1 ? "Select Source Material" : "Configure Video"}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              {fetchingMaterials ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs
                  defaultValue="theory"
                  onValueChange={setSelectedCategory}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="theory">Theory Courses</TabsTrigger>
                    <TabsTrigger value="lab">Lab Courses</TabsTrigger>
                  </TabsList>

                  <TabsContent value="theory" className="space-y-6">
                    {coursesData.theory.length === 0 ? (
                      <div className="text-center p-8 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground">
                          No theory materials found.
                        </p>
                      </div>
                    ) : (
                      coursesData.theory.map((course) => (
                        <Card key={course.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {course.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4">
                            {course.materials.map((material) => (
                              <div
                                key={material.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  selectedSourceId === material.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "hover:border-primary/50 hover:bg-muted/50"
                                }`}
                                onClick={() => handleSourceSelect(material)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">
                                      {material.title}
                                    </span>
                                  </div>
                                  {selectedSourceId === material.id && (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="lab" className="space-y-6">
                    {coursesData.lab.length === 0 ? (
                      <div className="text-center p-8 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground">
                          No lab materials found.
                        </p>
                      </div>
                    ) : (
                      coursesData.lab.map((course) => (
                        <Card key={course.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {course.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4">
                            {course.materials.map((material) => (
                              <div
                                key={material.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  selectedSourceId === material.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "hover:border-primary/50 hover:bg-muted/50"
                                }`}
                                onClick={() => handleSourceSelect(material)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <Code className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">
                                      {material.title}
                                    </span>
                                  </div>
                                  {selectedSourceId === material.id && (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!selectedSourceId}>
                  Next: Configure Video
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Video Configuration</CardTitle>
                <CardDescription>
                  Customize your video generation settings. Videos are generated using Google's Veo 3.1 model.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Video Title *</Label>
                    <Input
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Topic *</Label>
                    <Input
                      value={videoTopic}
                      onChange={(e) => setVideoTopic(e.target.value)}
                      placeholder="Enter topic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course *</Label>
                    <Input
                      value={videoCourse}
                      onChange={(e) => setVideoCourse(e.target.value)}
                      placeholder="Enter course name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Week</Label>
                    <Input
                      type="number"
                      value={videoWeek}
                      onChange={(e) => setVideoWeek(parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={durationSeconds} onValueChange={setDurationSeconds}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 seconds</SelectItem>
                        <SelectItem value="6">6 seconds</SelectItem>
                        <SelectItem value="8">8 seconds (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Video Style</Label>
                    <Select value={style} onValueChange={setStyle}>
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

                <div className="space-y-2">
                  <Label>Custom Instructions (Optional)</Label>
                  <Textarea
                    value={customization}
                    onChange={(e) => setCustomization(e.target.value)}
                    placeholder="E.g., Focus on visual demonstrations, include diagrams, or emphasize key concepts..."
                    rows={4}
                  />
                </div>

                {selectedSourceTitle && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium mb-1">Source Material:</p>
                    <p className="text-sm text-muted-foreground">{selectedSourceTitle}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !videoTitle || !videoTopic || !videoCourse}
                  className="w-32"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

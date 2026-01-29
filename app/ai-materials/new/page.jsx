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
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Loader2,
  BookOpen,
  Code,
  FileText,
  Presentation,
  FileType,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";

export default function NewMaterialPage() {
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

  const [materialType, setMaterialType] = useState("notes");
  const [customTitle, setCustomTitle] = useState("");
  const [customization, setCustomization] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, []);

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

  const handleSourceSelect = async (materialSummary) => {
    try {
      const res = await fetch(`/api/materials/${materialSummary.id}`);
      if (!res.ok) throw new Error("Failed to fetch material details");

      const material = await res.json();

      setSelectedSourceId(material._id);
      setSelectedSourceTitle(material.title);
      // Ensure content is set even if empty, but fileUrl might be present
      setSelectedSourceContent(material.content || "");
      setSelectedSourceMetadata({
        course: material.course,
        week: material.week,
        topic: material.topic,
        fileUrl: material.fileUrl, // Capture fileUrl
        sourceMaterialId: material._id, // Capture source ID
      });
      setCustomTitle(`Generated ${materialType} for ${material.title}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load source content");
    }
  };

  const handleGenerate = async () => {
    // Check if we have either content or a file URL (for PDF processing)
    if (!selectedSourceContent && !selectedSourceMetadata.fileUrl) {
      console.log("No Selected Source Content or File URL");
      toast.error("Please select a valid source material.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai-materials/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle || `Generated Material - ${selectedSourceTitle}`,
          type: materialType,
          category: selectedCategory,
          sourceContent: selectedSourceContent,
          customization,
          ...selectedSourceMetadata,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      toast.success("Material generated successfully!");
      router.push(`/ai-materials/${data._id}`);
    } catch (error) {
      toast.error(
        error.message || "Failed to generate material. Please try again.",
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Generate New Material</h1>
            <p className="text-muted-foreground mt-2">
              Step {step} of 2:{" "}
              {step === 1 ? "Select Source Material" : "Configure Generation"}
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
                  Next: Configure
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Customize how your material is generated.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Content Type</Label>
                  <RadioGroup
                    defaultValue={materialType}
                    onValueChange={(val) => {
                      setMaterialType(val);
                      setCustomTitle(
                        `Generated ${val} for ${selectedSourceTitle}`,
                      );
                    }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="notes"
                        id="notes"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="notes"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <FileText className="mb-3 h-6 w-6" />
                        Notes
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="slides"
                        id="slides"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="slides"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Presentation className="mb-3 h-6 w-6" />
                        Slides
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="pdf"
                        id="pdf"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="pdf"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <FileType className="mb-3 h-6 w-6" />
                        PDF
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="code-guide"
                        id="code-guide"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="code-guide"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Code className="mb-3 h-6 w-6" />
                        Code Guide
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter a title for your material"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custom Instructions (Optional)</Label>
                  <Textarea
                    value={customization}
                    onChange={(e) => setCustomization(e.target.value)}
                    placeholder="E.g., Focus on specific concepts, simplify the language, or include more examples..."
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-32"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Generate"
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

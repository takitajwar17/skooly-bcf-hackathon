"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/app/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar"
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { toast } from "sonner";
import { Loader2, UploadCloud, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [existingCourses, setExistingCourses] = useState([]);
  const [isNewCourse, setIsNewCourse] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Theory");
  const [type, setType] = useState("pdf");
  const [topic, setTopic] = useState("");
  const [week, setWeek] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/materials/courses");
      const json = await res.json();
      setExistingCourses(json.data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== UPLOAD FORM SUBMITTED ===");
    const finalCourse = isNewCourse ? newCourseName : selectedCourse;

    console.log("Form values:", { title, finalCourse, description, category, type, topic, week, tags, file: file?.name });

    if (!file) {
      console.log("ERROR: No file selected");
      toast.error("Please select a file");
      return;
    }
    if (!finalCourse) {
      console.log("ERROR: No course selected");
      toast.error("Please select or enter a course");
      return;
    }

    console.log("Validation passed, starting upload...");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("course", finalCourse);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("type", type);
    formData.append("topic", topic);
    formData.append("week", week);
    formData.append("tags", tags);

    console.log("FormData prepared, sending to /api/upload...");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Response received:", res.status, res.statusText);

      const result = await res.json();
      console.log("Response body:", result);

      if (!res.ok) {
        throw new Error(result?.error || "Upload failed");
      }

      console.log("Upload successful!");
      toast.success("Material uploaded successfully!");
      router.push("/materials");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload material");
    } finally {
      setIsUploading(false);
      console.log("=== UPLOAD PROCESS COMPLETE ===");
    }
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="w-full">
            <Link href="/materials" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Course Materials
            </Link>
            
            <Card className="shadow-sm border-none bg-muted/20">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-2xl">Upload Course Material</CardTitle>
                <CardDescription>Add new resources. They will be automatically categorized and prepared for AI search.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* File Upload Zone */}
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file">File</Label>
                    <Input id="file" type="file" onChange={handleFileChange} className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g. Intro to DBs" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <div className="flex flex-col gap-2">
                        {!isNewCourse ? (
                          <div className="flex gap-2">
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select Course" />
                              </SelectTrigger>
                              <SelectContent>
                                {existingCourses.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              onClick={() => setIsNewCourse(true)}
                              title="Create New Course"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input 
                              value={newCourseName} 
                              onChange={(e) => setNewCourseName(e.target.value)} 
                              placeholder="New course name..." 
                              className="flex-1"
                              autoFocus
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsNewCourse(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input 
                        id="topic" 
                        value={topic} 
                        onChange={(e) => setTopic(e.target.value)} 
                        placeholder="e.g. Normalization" 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Theory">Theory</SelectItem>
                          <SelectItem value="Lab">Lab</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="week">Week</Label>
                      <Input 
                        id="week" 
                        type="number" 
                        value={week} 
                        onChange={(e) => setWeek(e.target.value)} 
                        placeholder="e.g. 1" 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="slide">Slide</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="doc">Document</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input 
                      id="tags" 
                      value={tags} 
                      onChange={(e) => setTags(e.target.value)} 
                      placeholder="sql, database, relational" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Brief description of the material..." 
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Content...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload Material
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

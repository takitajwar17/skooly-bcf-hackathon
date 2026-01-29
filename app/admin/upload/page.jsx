"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/app/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  UploadCloud, 
  ChevronLeft, 
  Plus, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Tag,
  Hash,
  Info
} from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [existingCourses, setExistingCourses] = useState([]);
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
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
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchCourses();
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/materials/courses");
      const json = await res.json();
      setExistingCourses(json.data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      
      // Cleanup old preview URL if exists
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      // Generate preview URL for images and PDFs
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      // Auto-fill title from filename if title is empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
        // Prettify: replace dashes/underscores with spaces and capitalize
        const prettyName = nameWithoutExt
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        setTitle(prettyName);
      }
      
      // Auto-detect type from extension
      if (selectedFile.name) {
        const ext = selectedFile.name.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) setType('pdf');
        else if (['ppt', 'pptx'].includes(ext)) setType('slide');
        else if (['js', 'py', 'java', 'cpp', 'c', 'ts', 'html', 'css'].includes(ext)) setType('code');
        else if (['doc', 'docx'].includes(ext)) setType('doc');
        else if (['txt', 'md'].includes(ext)) setType('text');
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCourse = isNewCourse ? newCourseName : selectedCourse;

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (!finalCourse) {
      toast.error("Please specify a course");
      return;
    }

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

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      toast.success("Material uploaded and indexed successfully!");
      router.push("/materials");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload material. Please try again.");
    } finally {
      setIsUploading(false);
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
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/materials" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors group">
                <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Library
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Upload Material</h1>
              <p className="text-muted-foreground mt-1">Publish new resources for students and AI discovery.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: File Upload & Preview */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-2 border-dashed bg-muted/5 relative overflow-hidden group">
                <div 
                  className={`p-8 h-full flex flex-col items-center justify-center min-h-[300px] transition-colors ${dragActive ? 'bg-primary/5 border-primary' : 'border-muted-foreground/20'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <AnimatePresence mode="wait">
                    {!file ? (
                      <motion.div 
                        key="upload-prompt"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center"
                      >
                        <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <UploadCloud className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Select or drop file</h3>
                        <p className="text-sm text-muted-foreground mb-4">PDF, Slide, Code, or Text up to 10MB</p>
                        <Label 
                          htmlFor="file-upload" 
                          className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors inline-block"
                        >
                          Browse Files
                        </Label>
                        <input 
                          id="file-upload" 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="file-preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full"
                      >
                        <div className="flex flex-col items-center p-4 bg-background rounded-xl shadow-sm border border-primary/20">
                          <div className="relative mb-4 w-full aspect-[4/5] flex items-center justify-center overflow-hidden rounded-lg bg-muted/30 border shadow-inner">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : file.type === 'application/pdf' ? (
                              <iframe 
                                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                                className="w-full h-full pointer-events-none border-none"
                                title="PDF Preview"
                              />
                            ) : (
                              <div className="p-6 bg-muted rounded-2xl">
                                <FileText className="h-16 w-16 text-primary" />
                              </div>
                            )}
                            <button 
                              type="button"
                              onClick={removeFile}
                              className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg z-20"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            {file.type === 'application/pdf' && (
                              <div className="absolute inset-0 z-10 bg-transparent" />
                            )}
                          </div>
                          <div className="text-center overflow-hidden w-full">
                            <p className="font-medium text-sm truncate px-4">{file.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="mt-4 flex gap-2 w-full">
                            <Badge variant="secondary" className="flex-1 justify-center">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
                            <div className="bg-emerald-500/10 text-emerald-600 p-1 rounded-md">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>

              <Card className="bg-muted/10 border-none shadow-none p-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">AI Ready</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your files are automatically processed for the AI tutor. Text is extracted and indexed for vector search instantly.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Form Details */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">
                <Card className="shadow-sm border-none bg-muted/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Title</Label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g. Introduction to Neural Networks" 
                        className="bg-background"
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="course" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Course</Label>
                      <div className="flex flex-col gap-2">
                        {!isNewCourse ? (
                          <div className="flex gap-2">
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                              <SelectTrigger className="flex-1 bg-background">
                                <SelectValue placeholder="Select existing course" />
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
                              className="shrink-0 hover:bg-primary hover:text-primary-foreground transition-all"
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
                              className="flex-1 bg-background border-primary/30"
                              autoFocus
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsNewCourse(false)}
                              className="hover:text-destructive"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topic" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic</Label>
                      <div className="relative">
                        <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="topic" 
                          value={topic} 
                          onChange={(e) => setTopic(e.target.value)} 
                          placeholder="e.g. Backpropagation" 
                          className="pl-9 bg-background"
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Theory">Theory Lecture</SelectItem>
                          <SelectItem value="Lab">Practical Lab</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-muted/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Hash className="h-5 w-5 text-primary" />
                      Classification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="week" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Week Number</Label>
                        <Input 
                          id="week" 
                          type="number" 
                          value={week} 
                          onChange={(e) => setWeek(e.target.value)} 
                          placeholder="e.g. 1" 
                          className="bg-background"
                          required 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Type</Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">Portable Document (PDF)</SelectItem>
                            <SelectItem value="slide">Presentation Slides</SelectItem>
                            <SelectItem value="code">Source Code / Script</SelectItem>
                            <SelectItem value="doc">Word Document</SelectItem>
                            <SelectItem value="text">Plain Text / Markdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags (comma separated)</Label>
                      <Input 
                        id="tags" 
                        value={tags} 
                        onChange={(e) => setTags(e.target.value)} 
                        placeholder="machine-learning, calculus, tutorial" 
                        className="bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">Tags help students filter materials effectively.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                      <Textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="Provide a brief summary of what this material covers..." 
                        className="min-h-[100px] bg-background resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="flex-1 h-12"
                  >
                    Discard
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] h-12 shadow-lg shadow-primary/20" 
                    disabled={isUploading || !file}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing & Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-5 w-5" />
                        Finalize Upload
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

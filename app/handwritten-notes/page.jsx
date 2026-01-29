"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  UploadCloud,
  ChevronLeft,
  FileText,
  X,
  CheckCircle2,
  Copy,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "../components/ui/label";

export default function HandwrittenNotesPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (selectedFile) => {
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please upload an image file (JPG, PNG, etc.)");
        return;
      }

      setFile(selectedFile);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setResult(""); // Clear previous result
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
    setResult("");
  };

  const handleDigitize = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/handwritten-notes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setResult(data.text);
      toast.success("Notes digitized successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to digitize notes");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
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
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/materials"
                className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors group"
              >
                <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Library
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">
                Handwritten Notes Digitization
              </h1>
              <p className="text-muted-foreground mt-1">
                Convert your handwritten class notes into organized digital
                text.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Upload */}
            <div className="space-y-6">
              <Card className="border-2 border-dashed bg-muted/5 relative overflow-hidden group h-full min-h-[400px]">
                <div
                  className={`p-8 h-full flex flex-col items-center justify-center transition-colors ${dragActive ? "bg-primary/5 border-primary" : "border-muted-foreground/20"}`}
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
                        <h3 className="text-lg font-semibold mb-1">
                          Upload Handwritten Notes
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Drag & drop or click to upload an image
                        </p>
                        <Label
                          htmlFor="file-upload"
                          className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors inline-block"
                        >
                          Select Image
                        </Label>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
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
                        className="w-full h-full flex flex-col"
                      >
                        <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded-lg bg-muted/30 border shadow-inner mb-4">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-[400px] object-contain"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg z-20"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium truncate max-w-[200px]">
                            {file.name}
                          </div>
                          <Button
                            onClick={handleDigitize}
                            disabled={isProcessing}
                            className="shadow-lg shadow-primary/20"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Digitize Notes
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </div>

            {/* Right Column: Result */}
            <div className="space-y-6">
              <Card className="h-full flex flex-col min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Digitized Output
                  </CardTitle>
                  {result && (
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  {result ? (
                    <Textarea
                      value={result}
                      readOnly
                      className="h-full min-h-[350px] font-mono text-sm resize-none bg-muted/10 focus-visible:ring-0"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[350px] border-2 border-dashed rounded-lg border-muted">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <p>Digitized notes will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

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
  IconExternalLink, 
  IconFileText, 
  IconCode, 
  IconDeviceTv, 
  IconFile,
  IconLoader,
  IconLink,
  IconStack,
  IconClock,
  IconTag
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";

export default function MaterialPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMaterial();
    }
  }, [id]);

  const fetchMaterial = async () => {
    try {
      const res = await fetch(`/api/materials/${id}`);
      if (!res.ok) throw new Error("Failed to fetch material");
      const json = await res.json();
      setMaterial(json.data);
    } catch (error) {
      toast.error("Could not load material details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
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

  if (loading) {
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
          <div className="flex flex-1 justify-center items-center">
            <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!material) {
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">Material not found.</p>
            <Button onClick={() => router.back()} variant="outline">Go Back</Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const renderPreview = () => {
    const { type, fileUrl, content } = material;

    if (type === "pdf") {
      return (
        <div className="w-full h-full min-h-[75vh] rounded-xl border bg-muted/5 shadow-inner overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-full min-h-[75vh] border-none"
            title={material.title}
          />
        </div>
      );
    }

    if (type === "link") {
      return (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-xl bg-muted/5">
          <div className="p-6 bg-primary/10 rounded-full mb-6">
            <IconExternalLink className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">External Resource</h3>
          <p className="text-muted-foreground mb-8 max-w-md text-center">
            This material is hosted on an external website. Click the button below to open it in a new tab.
          </p>
          <Button size="lg" asChild className="gap-2 px-8 shadow-none">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="h-4 w-4" />
              Open Resource
            </a>
          </Button>
        </div>
      );
    }

    if (type === "code" || type === "text") {
      return (
        <Card className="bg-[#0d1117] text-[#e6edf3] border-slate-800 shadow-none overflow-hidden rounded-xl">
          <CardHeader className="py-3 px-6 border-b border-slate-800 bg-[#161b22] flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono flex items-center gap-2 text-slate-400">
              <IconCode className="h-4 w-4" />
              {material.title}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300 font-bold uppercase">
              {type}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="p-8 overflow-auto max-h-[70vh] text-sm font-mono leading-relaxed selection:bg-blue-500/30">
              <code>{content || "No content available for preview."}</code>
            </pre>
          </CardContent>
        </Card>
      );
    }

    if (type === "slide" && fileUrl?.endsWith(".pdf")) {
      return (
        <div className="w-full h-full min-h-[75vh] rounded-xl border bg-muted/5 shadow-inner overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-full min-h-[75vh] border-none"
            title={material.title}
          />
        </div>
      );
    }

    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl);
    if (isImage) {
      return (
        <div className="flex justify-center bg-muted/5 rounded-xl border border-dashed p-12">
          <img
            src={fileUrl}
            alt={material.title}
            className="max-w-full max-h-[75vh] object-contain rounded-lg border shadow-2xl"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-xl bg-muted/5">
        <IconFile className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground mb-6 font-medium">No preview available for this file type.</p>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="shadow-none">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
              <IconExternalLink className="h-4 w-4" />
              Open Original
            </a>
          </Button>
          <Button asChild className="shadow-none">
            <a href={getDownloadUrl(material.fileUrl)} className="gap-2">
              <IconDownload className="h-4 w-4" />
              Download Now
            </a>
          </Button>
        </div>
      </div>
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case "code": return <IconCode className="h-6 w-6 text-blue-500" />;
      case "slide": return <IconDeviceTv className="h-6 w-6 text-orange-500" />;
      case "pdf": return <IconFileText className="h-6 w-6 text-red-500" />;
      case "link": return <IconLink className="h-6 w-6 text-emerald-500" />;
      default: return <IconFile className="h-6 w-6 text-slate-500" />;
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
          
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 text-muted-foreground hover:text-foreground transition-colors group"
                onClick={() => router.back()}
              >
                <IconChevronLeft className="size-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Materials
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCopyLink} title="Copy Link" className="size-9 rounded-full">
                <IconLink className="size-4" />
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-muted/50 rounded-2xl border border-muted shadow-inner">
                  {getIcon(material.type)}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-md uppercase text-[10px] font-bold tracking-wider px-2 border-primary/20 text-primary bg-primary/5">
                      {material.type}
                    </Badge>
                    <Badge variant="outline" className="rounded-md text-[10px] font-medium px-2 bg-muted/50">
                      <IconStack className="size-3 mr-1" />
                      {material.course}
                    </Badge>
                    <Badge variant="outline" className="rounded-md text-[10px] font-medium px-2 bg-muted/50">
                      <IconClock className="size-3 mr-1" />
                      Week {material.week}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">{material.title}</h1>
                  <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed italic">
                    {material.description || `Learning resource for ${material.topic}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-none h-10 gap-2 shadow-none" asChild>
                  <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                    <IconExternalLink className="size-4" />
                    Open Original
                  </a>
                </Button>
                <Button className="flex-1 md:flex-none h-10 gap-2 shadow-none" asChild>
                  <a href={getDownloadUrl(material.fileUrl)}>
                    <IconDownload className="size-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>

            {material.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {material.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="font-normal text-[10px] bg-muted/30 hover:bg-muted transition-colors cursor-default border-none shadow-none px-2 py-0.5">
                    <IconTag className="size-3 mr-1 opacity-50" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            {renderPreview()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
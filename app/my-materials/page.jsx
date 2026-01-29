"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  PenTool,
  Plus,
  Search,
  BookOpen,
  Code,
  FileText,
  Presentation,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function MyMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/my-materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "ai" && item.type === "ai-note") ||
      (activeTab === "handwritten" && item.type === "handwritten");
    return matchesSearch && matchesTab;
  });

  const getIcon = (type, subType) => {
    if (type === "handwritten") return <PenTool className="h-5 w-5" />;
    
    switch (subType) {
      case "notes": return <FileText className="h-5 w-5" />;
      case "slides": return <Presentation className="h-5 w-5" />;
      case "code-guide": return <Code className="h-5 w-5" />;
      case "mcq": return <CheckCircle2 className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getLink = (item) => {
    if (item.type === "handwritten") {
        return `/handwritten-notes/${item._id}`;
    }
    return `/ai-materials/${item._id}`;
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
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Materials</h1>
              <p className="text-muted-foreground mt-1">
                Manage your AI-generated study aids and digitized notes.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/handwritten-notes")}
                className="gap-2"
              >
                <PenTool className="h-4 w-4" />
                Digitize Notes
              </Button>
              <Button
                onClick={() => router.push("/ai-materials/new")}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
              >
                <Sparkles className="h-4 w-4" />
                Create AI Notes
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All Materials</TabsTrigger>
                <TabsTrigger value="ai">AI Generated</TabsTrigger>
                <TabsTrigger value="handwritten">Handwritten</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/5">
              <div className="bg-muted p-4 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No materials found</h3>
              <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                You haven't created any materials yet. Start by digitizing your
                notes or generating AI study content.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.push("/handwritten-notes")}>
                  Digitize Notes
                </Button>
                <Button onClick={() => router.push("/ai-materials/new")}>
                  Generate AI Content
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((item) => (
                <Card
                  key={item._id}
                  className={`group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer flex flex-col ${
                    item.type === "ai-note"
                      ? "border-purple-200 dark:border-purple-900 bg-gradient-to-br from-white to-purple-50/50 dark:from-background dark:to-purple-950/10"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => router.push(getLink(item))}
                >
                  {/* AI Note Shiny Effect */}
                  {item.type === "ai-note" && (
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="h-12 w-12 text-purple-500" />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <Badge
                        variant={item.type === "ai-note" ? "default" : "secondary"}
                        className={`mb-2 w-fit ${
                          item.type === "ai-note"
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                            : ""
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {getIcon(item.type, item.subType)}
                          {item.type === "ai-note" ? "AI Generated" : "Handwritten"}
                        </span>
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {item.metadata?.course && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3" />
                          <span>{item.metadata.course}</span>
                        </div>
                      )}
                      {item.metadata?.topic && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs bg-muted px-1.5 py-0.5 rounded">
                            Topic
                          </span>
                          <span>{item.metadata.topic}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 text-xs text-muted-foreground border-t bg-muted/5 p-4 mt-auto">
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-primary" />
                    </div>
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

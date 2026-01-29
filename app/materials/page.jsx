"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/app/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { FileText, Code, MonitorPlay, File, Download, Loader2, Search, Plus, BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MaterialsPage() {
  const { user } = useUser();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [search, setSearch] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/materials", {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(id);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      setMaterials(json.data || []);
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error("Request timed out.");
      } else {
        toast.error("Could not load course materials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMaterials(prev => prev.filter(m => m._id !== id));
      toast.success("Material deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete material");
    }
  };

  const courses = [...new Set(materials.map(m => m.course))];
  const courseMaterials = selectedCourse ? materials.filter(m => m.course === selectedCourse) : [];

  const filteredMaterials = courseMaterials.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.topic.toLowerCase().includes(search.toLowerCase());
    const matchesWeek = weekFilter === "all" || item.week.toString() === weekFilter;
    return matchesSearch && matchesWeek;
  });

  const theoryMaterials = filteredMaterials.filter(m => m.category === "Theory");
  const labMaterials = filteredMaterials.filter(m => m.category === "Lab");

  const getIcon = (type) => {
    switch (type) {
      case "code": return <Code className="h-6 w-6 text-blue-500" />;
      case "slide": return <MonitorPlay className="h-6 w-6 text-orange-500" />;
      case "pdf": return <FileText className="h-6 w-6 text-red-500" />;
      default: return <File className="h-6 w-6 text-gray-500" />;
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedCourse ? selectedCourse : "Course Materials"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {selectedCourse ? "Browse lecture notes and labs." : "Select a course."}
              </p>
            </div>
            {isAdmin && (
              <Link href="/admin/upload">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Material
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex flex-1 justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedCourse ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length === 0 ? (
                <div className="col-span-full text-center py-12 border rounded-xl bg-muted/20">
                  <p className="text-muted-foreground">No courses found.</p>
                </div>
              ) : (
                courses.map(courseName => (
                  <Card 
                    key={courseName} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCourse(courseName)}
                  >
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{courseName}</CardTitle>
                        <CardDescription>
                          {materials.filter(m => m.course === courseName).length} Materials
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="self-start mb-4 -ml-2 text-muted-foreground"
                onClick={() => setSelectedCourse(null)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Courses
              </Button>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={weekFilter} onValueChange={setWeekFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weeks</SelectItem>
                    {[...Array(15)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>Week {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="theory" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="theory">Theory ({theoryMaterials.length})</TabsTrigger>
                  <TabsTrigger value="lab">Lab ({labMaterials.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="theory" className="space-y-4">
                  <MaterialGrid items={theoryMaterials} getIcon={getIcon} onDelete={handleDelete} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="lab" className="space-y-4">
                  <MaterialGrid items={labMaterials} getIcon={getIcon} onDelete={handleDelete} isAdmin={isAdmin} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MaterialGrid({ items, getIcon, onDelete, isAdmin }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl bg-muted/20">
        <p className="text-muted-foreground">No materials found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card key={item._id} className="flex flex-col shadow-sm group hover:border-primary/50 transition-colors">
          <Link href={`/materials/${item._id}`} className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex gap-3">
                <div className="mt-1 p-2 bg-muted rounded-lg h-fit group-hover:bg-primary/10 transition-colors">{getIcon(item.type)}</div>
                <div className="space-y-1">
                  <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">{item.title}</CardTitle>
                  <CardDescription className="text-xs">Week {item.week} • {item.topic}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{item.description}</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Link>
          <CardFooter className="pt-2 border-t bg-muted/5 gap-2">
            <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 h-8 text-xs" asChild>
              <Link href={`/materials/${item._id}`}>
                <FileText className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="px-2 h-8 text-xs text-muted-foreground hover:text-primary" asChild>
              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                onClick={() => onDelete(item._id)}
              >
                Delete
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

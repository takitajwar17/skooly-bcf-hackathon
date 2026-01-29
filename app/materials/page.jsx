"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/app/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar"
import { 
  Card, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardAction
} from "@/app/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/app/components/ui/drawer"
import { 
  IconBook,
  IconChevronLeft,
  IconDownload,
  IconFileText,
  IconFilter,
  IconLayoutGrid,
  IconList,
  IconLoader,
  IconPlus,
  IconSearch,
  IconTrash,
  IconArrowRight,
  IconCode,
  IconDeviceTv,
  IconFile,
  IconStack,
  IconClock,
  IconExternalLink,
  IconX
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MaterialsPage() {
  const { user } = useUser();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  
  const [search, setSearch] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials", {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      setMaterials(json.data || []);
    } catch (error) {
      toast.error("Could not load course materials.");
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

  const courses = useMemo(() => [...new Set(materials.map(m => m.course))], [materials]);
  
  const courseMaterials = useMemo(() => 
    selectedCourse ? materials.filter(m => m.course === selectedCourse) : []
  , [materials, selectedCourse]);

  const filteredMaterials = useMemo(() => 
    courseMaterials.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                            item.topic.toLowerCase().includes(search.toLowerCase());
      const matchesWeek = weekFilter === "all" || item.week.toString() === weekFilter;
      return matchesSearch && matchesWeek;
    })
  , [courseMaterials, search, weekFilter]);

  const stats = useMemo(() => {
    if (!selectedCourse) return null;
    return {
      total: courseMaterials.length,
      theory: courseMaterials.filter(m => m.category === "Theory").length,
      lab: courseMaterials.filter(m => m.category === "Lab").length,
      weeks: [...new Set(courseMaterials.map(m => m.week))].length
    };
  }, [courseMaterials, selectedCourse]);

  const theoryMaterials = filteredMaterials.filter(m => m.category === "Theory");
  const labMaterials = filteredMaterials.filter(m => m.category === "Lab");

  const getIcon = (type) => {
    switch (type) {
      case "code": return <IconCode className="h-5 w-5 text-blue-500" />;
      case "slide": return <IconDeviceTv className="h-5 w-5 text-orange-500" />;
      case "pdf": return <IconFileText className="h-5 w-5 text-red-500" />;
      default: return <IconFile className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden flex flex-col h-screen">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2 overflow-hidden">
            <ScrollArea className="flex-1 no-scrollbar">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div>
                  <AnimatePresence mode="wait">
                    {!selectedCourse ? (
                      <motion.div
                        key="title-all"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <h1 className="text-2xl font-semibold tracking-tight">
                          Knowledge Hub
                        </h1>
                        <p className="text-sm text-muted-foreground">Access all your course resources in one place.</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="title-course"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 -ml-2"
                            onClick={() => setSelectedCourse(null)}
                          >
                            <IconChevronLeft className="size-4" />
                          </Button>
                          <h1 className="text-2xl font-semibold tracking-tight">
                            {selectedCourse}
                          </h1>
                        </div>
                        <div className="flex items-center gap-2 pl-8">
                          <Badge variant="outline" className="text-muted-foreground">
                            <IconStack className="size-3 mr-1" /> {stats?.total} Materials
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground">
                            <IconClock className="size-3 mr-1" /> {stats?.weeks} Weeks
                          </Badge>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {isAdmin && (
                  <Link href="/admin/upload">
                    <Button size="sm">
                      <IconPlus className="size-4" />
                      Add Material
                    </Button>
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="flex flex-1 justify-center items-center py-32">
                  <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !selectedCourse ? (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
                >
                  {courses.length === 0 ? (
                    <div className="col-span-full text-center py-24 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-medium">No Courses Found</h3>
                      <p className="text-muted-foreground">Upload some materials to start building your library.</p>
                    </div>
                  ) : (
                    courses.map((courseName, index) => (
                      <motion.div
                        key={courseName}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="group cursor-pointer hover:border-primary/30 transition-all duration-200 border shadow-none"
                          onClick={() => setSelectedCourse(courseName)}
                        >
                          <CardHeader>
                            <CardDescription>Course</CardDescription>
                            <CardTitle className="text-xl font-semibold tracking-tight truncate">
                              {courseName}
                            </CardTitle>
                            <CardAction>
                              <Badge variant="outline" className="tabular-nums font-medium">
                                {materials.filter(m => m.course === courseName).length} items
                              </Badge>
                            </CardAction>
                          </CardHeader>
                          <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                              Open curriculum <IconArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="text-muted-foreground">
                              View lecture and lab resources
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col gap-6 px-4 lg:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  <Tabs defaultValue="theory" className="w-full flex-col justify-start gap-6">
                    <div className="flex items-center justify-between">
                      <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 flex **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
                        <TabsTrigger value="theory">
                          Theory <Badge variant="secondary">{theoryMaterials.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="lab">
                          Lab <Badge variant="secondary">{labMaterials.length}</Badge>
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="flex items-center gap-2">
                        <div className="relative w-64 hidden md:block">
                          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            className="pl-9 h-8 bg-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                        <Select value={weekFilter} onValueChange={setWeekFilter}>
                          <SelectTrigger className="w-32 h-8" size="sm">
                            <IconFilter className="size-3 mr-1" />
                            <SelectValue placeholder="Week" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Weeks</SelectItem>
                            {[...new Set(courseMaterials.map(m => m.week))].sort((a,b) => a-b).map((w) => (
                              <SelectItem key={w} value={w.toString()}>Week {w}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md">
                          <Button 
                            variant={viewMode === "grid" ? "secondary" : "ghost"} 
                            size="icon" 
                            className="size-7"
                            onClick={() => setViewMode("grid")}
                          >
                            <IconLayoutGrid className="size-3.5" />
                          </Button>
                          <Button 
                            variant={viewMode === "list" ? "secondary" : "ghost"} 
                            size="icon" 
                            className="size-7"
                            onClick={() => setViewMode("list")}
                          >
                            <IconList className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <TabsContent value="theory" className="m-0 focus-visible:outline-none">
                      <MaterialGrid items={theoryMaterials} getIcon={getIcon} onDelete={handleDelete} isAdmin={isAdmin} viewMode={viewMode} />
                    </TabsContent>
                    <TabsContent value="lab" className="m-0 focus-visible:outline-none">
                      <MaterialGrid items={labMaterials} getIcon={getIcon} onDelete={handleDelete} isAdmin={isAdmin} viewMode={viewMode} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MaterialPreviewDrawer({ item, getIcon, children }) {
  const [isOpen, setIsOpen] = useState(false);

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

  const renderPreview = () => {
    const { type, fileUrl, content } = item;

    if (type === "pdf") {
      return (
        <div className="w-full h-full min-h-[500px] rounded-lg border bg-muted/10 overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border-none"
            title={item.title}
          />
        </div>
      );
    }

    if (type === "link") {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 border-2 border-dashed rounded-xl bg-muted/5">
          <IconExternalLink className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">External Resource</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs text-center">
            This material is hosted externally.
          </p>
          <Button asChild className="gap-2">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              Open Resource
            </a>
          </Button>
        </div>
      );
    }

    if (type === "code" || type === "text") {
      return (
        <div className="bg-[#0d1117] text-[#e6edf3] rounded-lg border border-slate-800 h-full overflow-hidden flex flex-col">
          <div className="py-2 px-4 border-b border-slate-800 bg-[#161b22] text-xs font-mono text-slate-400">
            {item.title}
          </div>
          <pre className="p-6 overflow-auto text-sm font-mono leading-relaxed flex-1">
            <code>{content || "No content available for preview."}</code>
          </pre>
        </div>
      );
    }

    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl);
    if (isImage) {
      return (
        <div className="flex justify-center items-center h-full bg-muted/10 rounded-xl border p-4">
          <img
            src={fileUrl}
            alt={item.title}
            className="max-w-full max-h-full object-contain rounded shadow-lg"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full py-20 border-2 border-dashed rounded-xl bg-muted/5">
        <IconFile className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-sm text-muted-foreground mb-6 font-medium">No preview available for this type.</p>
        <Button asChild>
          <a href={getDownloadUrl(item.fileUrl)} className="gap-2">
            <IconDownload className="size-4" />
            Download Now
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="h-full w-full sm:max-w-2xl mt-0 rounded-none border-l">
        <div className="flex flex-col h-full">
          <DrawerHeader className="border-b px-6 py-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                {getIcon(item.type)}
              </div>
              <div>
                <DrawerTitle className="text-lg font-bold truncate max-w-[300px]">{item.title}</DrawerTitle>
                <DrawerDescription className="text-xs">
                  Week {item.week} • {item.topic}
                </DrawerDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="size-8">
                <IconX className="size-4" />
              </Button>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden p-6">
            {renderPreview()}
          </div>
          <DrawerFooter className="border-t px-6 py-4 flex flex-row gap-2">
            <Button className="flex-1 h-10 gap-2" asChild>
              <a href={getDownloadUrl(item.fileUrl)}>
                <IconDownload className="size-4" />
                Download Material
              </a>
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" asChild title="Full View">
              <Link href={`/materials/${item._id}`}>
                <IconExternalLink className="size-4" />
              </Link>
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MaterialGrid({ items, getIcon, onDelete, isAdmin, viewMode }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-24 border-2 border-dashed rounded-lg">
        <h4 className="font-medium">No materials found</h4>
        <p className="text-sm text-muted-foreground">Adjust your search or filters.</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[400px]">Title</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Week</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id} className="group/row">
                <TableCell className="font-medium">
                  <MaterialPreviewDrawer item={item} getIcon={getIcon}>
                    <button className="flex items-center gap-2 hover:underline decoration-primary text-left">
                      {getIcon(item.type)}
                      <span className="truncate">{item.title}</span>
                    </button>
                  </MaterialPreviewDrawer>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.topic}</TableCell>
                <TableCell>W{item.week}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase text-[10px] font-bold">{item.type}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="size-8" asChild title="Download">
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                        <IconDownload className="size-4 text-muted-foreground" />
                      </a>
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="size-8 text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity" onClick={() => onDelete(item._id)} title="Delete">
                        <IconTrash className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item._id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card className="flex flex-col h-full group *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card bg-gradient-to-t border shadow-none overflow-hidden">
              <MaterialPreviewDrawer item={item} getIcon={getIcon}>
                <div className="flex-1 flex flex-col cursor-pointer">
                  {/* Small Visual Preview */}
                  <div className="aspect-[16/9] w-full bg-muted/30 border-b relative overflow-hidden group-hover:bg-muted/50 transition-colors">
                    {item.type === "pdf" ? (
                      <div className="w-full h-full pointer-events-none scale-[0.5] origin-top opacity-50 group-hover:opacity-100 transition-opacity">
                        <iframe
                          src={`${item.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-[200%] h-[200%] border-none"
                          title="Card Preview"
                        />
                      </div>
                    ) : /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.fileUrl) ? (
                      <img 
                        src={item.fileUrl} 
                        alt="" 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                        {getIcon(item.type)}
                      </div>
                    )}
                    <div className="absolute inset-0 z-10 bg-transparent" />
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-background rounded-lg border border-muted">
                        {getIcon(item.type)}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tabular-nums">
                        W{item.week}
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-3 text-left">
                      <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{item.topic}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1 text-left italic">
                      {item.description || "No description provided."}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {item.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[9px] font-normal px-1.5 py-0">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </MaterialPreviewDrawer>
              <CardFooter className="px-4 py-3 bg-muted/20 border-t flex justify-between gap-2">
                <MaterialPreviewDrawer item={item} getIcon={getIcon}>
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs font-medium bg-background hover:bg-muted border border-muted shadow-none">
                    Preview
                  </Button>
                </MaterialPreviewDrawer>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8 hover:bg-background border border-transparent hover:border-muted shadow-none" asChild>
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                      <IconDownload className="size-4 text-muted-foreground" />
                    </a>
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 shadow-none" onClick={() => onDelete(item._id)}>
                      <IconTrash className="size-4" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
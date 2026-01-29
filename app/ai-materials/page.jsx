"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Plus, FileText, Presentation, FileCode, FileType } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/app/components/ui/skeleton";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";

export default function AiMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/v1/ai-materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Failed to fetch materials", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "text":
      case "notes":
        return <FileText className="h-6 w-6 text-blue-500" />;
      case "slide":
      case "slides":
        return <Presentation className="h-6 w-6 text-orange-500" />;
      case "code":
      case "code-guide":
        return <FileCode className="h-6 w-6 text-green-500" />;
      case "pdf":
        return <FileType className="h-6 w-6 text-red-500" />;
      default:
        return <FileText className="h-6 w-6" />;
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
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AI Learning Materials
              </h1>
              <p className="text-muted-foreground mt-2">
                Generate and manage your AI-powered study resources.
              </p>
            </div>
            <Link href="/ai-materials/new">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" /> Generate New
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <h3 className="text-lg font-medium">No materials yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by generating your first study material.
              </p>
              <Link href="/ai-materials/new">
                <Button variant="outline">Create Now</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <Link key={material._id} href={`/ai-materials/${material._id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className="p-2 bg-muted rounded-lg">
                        {getIcon(material.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg line-clamp-1">
                          {material.title}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {material.category} •{" "}
                          {format(new Date(material.createdAt), "MMM d, yyyy")}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {material.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Folder, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { createProject, deleteProject } from "@/lib/actions/project";

export function ProjectList({ initialProjects }) {
  const [projects, setProjects] = useState(initialProjects);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get("title");
    const description = formData.get("description");

    startTransition(async () => {
      try {
        const newProject = await createProject(title, description);
        setProjects([newProject, ...projects]);
        setIsOpen(false);
        toast.success("Project created");
        router.refresh();
      } catch (error) {
        toast.error("Failed to create project");
      }
    });
  };

  const handleDelete = async (id, e) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p._id !== id));
      toast.success("Project deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Add a new project to organize your files.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Name</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
            <Folder className="h-10 w-10 mb-4 opacity-50" />
            <p>No projects found. Create one to get started.</p>
          </div>
        ) : (
          projects.map((project) => (
            <Link key={project._id} href={`/projects/${project._id}`}>
              <Card className="h-full hover:bg-accent/50 transition-colors group relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="truncate pr-4">{project.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(project._id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="text-xs text-muted-foreground">
                  Updated {format(new Date(project.updatedAt), "PP")}
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

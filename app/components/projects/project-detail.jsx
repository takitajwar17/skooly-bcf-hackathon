"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
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
import { createFile, deleteFile } from "@/lib/actions/file";

export function ProjectDetail({ project, initialFiles }) {
  const [files, setFiles] = useState(initialFiles);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreateFile = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");

    startTransition(async () => {
      try {
        const newFile = await createFile(project._id, name);
        setFiles([...files, newFile]);
        setIsOpen(false);
        toast.success("File created");
        router.refresh();
      } catch (error) {
        toast.error("Failed to create file");
      }
    });
  };

  const handleDeleteFile = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFile(id);
      setFiles(files.filter(f => f._id !== id));
      toast.success("File deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
          </Link>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create File</DialogTitle>
              <DialogDescription>
                Create a new text file in this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFile}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Filename</Label>
                  <Input id="name" name="name" placeholder="readme.md" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create File"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
            <FileText className="h-10 w-10 mb-4 opacity-50" />
            <p>No files yet. Create one to start editing.</p>
          </div>
        ) : (
          files.map((file) => (
            <Link key={file._id} href={`/projects/${project._id}/files/${file._id}`}>
              <Card className="hover:bg-accent/50 transition-colors group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Last edited {format(new Date(file.updatedAt), "PP p")}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteFile(file._id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

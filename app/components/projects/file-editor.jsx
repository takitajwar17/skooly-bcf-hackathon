"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { updateFile } from "@/lib/actions/file";

export function FileEditor({ project, file }) {
  const [content, setContent] = useState(file.content || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFile(file._id, content);
      toast.success("File saved");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link 
            href={`/projects/${project._id}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-xl font-bold">{file.name}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 border rounded-md overflow-hidden bg-background">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full resize-none border-none focus-visible:ring-0 p-4 font-mono text-sm"
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
}

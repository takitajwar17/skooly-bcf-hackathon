"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { ArrowLeft, Printer, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

export default function HandwrittenNoteViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNote();
  }, [params.id]);

  const fetchNote = async () => {
    try {
      const res = await fetch(`/api/handwritten-notes/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data);
      }
    } catch (error) {
      console.error("Failed to fetch note:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
            <Skeleton className="h-12 w-1/3 mb-4" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Note Not Found</h1>
          <Button onClick={() => router.push("/my-materials")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b px-6 py-3 flex items-center justify-between bg-background shrink-0">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/my-materials")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <h1 className="font-semibold text-lg">{note.title}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {note.course && (
                        <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" /> {note.course}
                        </span>
                    )}
                    {note.topic && (
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {note.topic}
                        </span>
                    )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" /> Print/PDF
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-muted/10 p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-background rounded-xl border shadow-sm p-8 md:p-12 min-h-full">
                <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown
                    components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                        <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                        >
                            {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                        ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                        );
                    },
                    }}
                >
                    {note.content}
                </ReactMarkdown>
                </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

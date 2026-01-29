"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  ArrowLeft,
  Send,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "@/app/components/ui/skeleton";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";

export default function MaterialViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMaterial();
  }, [params.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMaterial = async () => {
    try {
      const res = await fetch(`/api/v1/ai-materials/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMaterial(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/v1/ai-materials/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: material._id,
          message: newMsg.content,
          history: messages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ **Error:** Failed to send message. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading)
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
            <Skeleton className="h-full w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  if (!material) return <div className="p-8">Material not found</div>;

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
        <div className="flex flex-1 overflow-hidden">
          {/* Main Layout Container */}
          <div className="flex w-full h-full overflow-hidden">
            {/* Left Side: Content Viewer (Scrollable) */}
            <div className="w-[60%] h-full flex flex-col border-r bg-muted/10">
              <header className="border-b px-6 py-3 flex items-center justify-between bg-background shrink-0">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/ai-materials")}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="font-semibold text-lg truncate max-w-[400px]">
                    {material.title}
                  </h1>
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

              <div className="flex-1 overflow-y-auto p-8">
                <ContentRenderer
                  type={material.type}
                  content={material.content}
                />
              </div>
            </div>

            {/* Right Side: Chat Interface (Fixed + Scrollable Area) */}
            <div className="w-[40%] h-full flex flex-col bg-background">
              <div className="p-4 border-b shrink-0 bg-background z-10">
                <h2 className="font-semibold">AI Assistant</h2>
                <p className="text-xs text-muted-foreground">
                  Ask questions about this material
                </p>
              </div>

              <ScrollArea className="flex-1 p-4 w-full  overflow-y-scroll">
                <div className="space-y-4 pb-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      Ask me anything about "{material.title}"!
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 text-sm ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 text-sm">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t mt-auto shrink-0 bg-background z-10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a question..."
                  />
                  <Button type="submit" size="icon" disabled={chatLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ContentRenderer({ type, content }) {
  if (type === "slides" || type === "slide") {
    return <SlideRenderer content={content} />;
  }

  return (
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
        {content}
      </ReactMarkdown>
    </div>
  );
}

function SlideRenderer({ content }) {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const slides = content
    .split("---")
    .map((s) => s.trim())
    .filter((s) => s);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div
        className="overflow-hidden w-full max-w-3xl aspect-video border rounded-xl shadow-2xl bg-card"
        ref={emblaRef}
      >
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 p-12 flex flex-col justify-center"
            >
              <div className="prose dark:prose-invert max-w-none scale-125 origin-center">
                <ReactMarkdown>{slide}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="py-2 text-sm text-muted-foreground">
          Swipe or use buttons to navigate
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => emblaApi?.scrollNext()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

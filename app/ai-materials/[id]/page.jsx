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
  Play,
  Pause,
  RotateCcw,
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
                    onClick={() => router.push("/my-materials")}
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
                  audioUrl={material.audioUrl}
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

function AudioPlayer({ audioUrl, script }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isPlaying ? "" : "hidden"}`}
            ></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          AI Podcast Player
        </h2>

        <audio ref={audioRef} src={audioUrl} className="hidden" />

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleRestart}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg shadow-primary/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 fill-current" />
              ) : (
                <Play className="h-8 w-8 fill-current ml-1" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <span>{formatTime(audioRef.current?.duration || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Transcript</h3>
        <div className="prose dark:prose-invert max-w-none p-6 border rounded-xl bg-muted/5">
          <ReactMarkdown>{script}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ContentRenderer({ type, content, audioUrl }) {
  if (type === "slides" || type === "slide") {
    return <SlideRenderer content={content} />;
  }
  if (type === "mcq") {
    return <MCQRenderer content={content} />;
  }
  if (type === "podcast" && audioUrl) {
    return <AudioPlayer audioUrl={audioUrl} script={content} />;
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

function MCQRenderer({ content }) {
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  // Track which questions have been revealed
  const [revealedQuestions, setRevealedQuestions] = useState({});

  useEffect(() => {
    try {
      const cleanContent = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      setQuestions(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("Failed to parse MCQs:", e);
    }
  }, [content]);

  const handleOptionSelect = (qIndex, option) => {
    // If already revealed, do nothing
    if (revealedQuestions[qIndex]) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: option,
    }));

    // Reveal the answer for this question immediately
    setRevealedQuestions((prev) => ({
      ...prev,
      [qIndex]: true,
    }));
  };

  if (!questions.length) return <div>Invalid quiz format</div>;

  // Calculate current score based on revealed questions
  const currentScore = Object.keys(revealedQuestions).reduce((acc, qIndex) => {
    const idx = parseInt(qIndex);
    if (selectedAnswers[idx] === questions[idx].correctAnswer) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const answeredCount = Object.keys(revealedQuestions).length;

  return (
    <div className="max-w-full mx-auto space-y-8 pb-12">
      <div className="flex items-start justify-between sticky -top-10 bg-background backdrop-blur z-10 py-4 border-b">
        <h2 className="text-2xl font-bold">Quiz</h2>
        <div className="text-lg font-bold px-4 py-2 bg-primary/10 rounded-lg">
          Score: {currentScore} / {answeredCount}
        </div>
      </div>

      {questions.map((q, idx) => {
        const isRevealed = revealedQuestions[idx];
        const selected = selectedAnswers[idx];

        return (
          <div key={idx} className="p-6 border rounded-xl bg-card shadow-sm">
            <h3 className="font-semibold text-lg mb-4">
              {idx + 1}. {q.question}
            </h3>
            <div className="grid gap-3">
              {q.options.map((option, optIdx) => {
                let optionClass =
                  "p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent";

                if (isRevealed) {
                  if (option === q.correctAnswer) {
                    optionClass =
                      "p-4 rounded-lg border bg-green-500/20 border-green-500 font-medium";
                  } else if (selected === option) {
                    optionClass =
                      "p-4 rounded-lg border bg-red-500/20 border-red-500";
                  } else {
                    optionClass = "p-4 rounded-lg border opacity-60";
                  }
                } else if (selected === option) {
                  optionClass =
                    "p-4 rounded-lg border border-primary bg-primary/10 ring-1 ring-primary";
                }

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleOptionSelect(idx, option)}
                    className={optionClass}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selected === option ||
                          (isRevealed && option === q.correctAnswer)
                            ? "border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {(selected === option ||
                          (isRevealed && option === q.correctAnswer)) && (
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isRevealed && option === q.correctAnswer
                                ? "bg-green-600"
                                : "bg-primary"
                            }`}
                          />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {isRevealed && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                  selected === q.correctAnswer
                    ? "bg-green-500/10 text-green-800 dark:text-green-300"
                    : "bg-red-500/10 text-red-800 dark:text-red-300"
                }`}
              >
                <div className="font-bold mb-1">
                  {selected === q.correctAnswer
                    ? "✅ Correct!"
                    : "❌ Incorrect"}
                </div>
                <span className="font-semibold">Explanation: </span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
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

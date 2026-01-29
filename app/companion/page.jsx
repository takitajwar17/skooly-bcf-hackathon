"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { ChatHistorySidebar } from "@/app/components/chat/ChatHistorySidebar";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import {
  IconSend,
  IconPlus,
  IconMicrophone,
  IconRobot,
  IconUser,
  IconLoader,
  IconBrain,
  IconCopy,
  IconRefresh,
  IconExternalLink,
  IconFileText,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { toast } from "sonner";

const FIXED_MODEL = {
  id: "gemini-2.0-flash",
  name: "Gemini 2.0 Flash",
  provider: "Google",
  color: "bg-chart-4",
};

const suggestions = [
  "Find materials on data structures",
  "Explain recursion with examples",
  "Summarize Week 3 lectures",
  "Show me C programming notes",
];

export default function CompanionPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef(null);
  const [chatId, setChatId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const toggleSources = (messageId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);
    setExpandedSources({});
  };

  const handleSelectChat = async (selectedChatId) => {
    if (selectedChatId === chatId) return;

    try {
      const response = await fetch(`/api/chat?chatId=${selectedChatId}`);
      const data = await response.json();

      if (data.chat && data.chat.messages) {
        setChatId(selectedChatId);
        setMessages(
          data.chat.messages.map((m, i) => ({
            id: nanoid(),
            role: m.role,
            content: m.content,
            relevantFiles: [],
            intent: "explain",
          })),
        );
        setExpandedSources({});
      }
    } catch (error) {
      toast.error("Failed to load chat");
    }
  };

  const regenerateResponse = async (messageId) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    const userMsg = messages[msgIndex - 1];
    if (userMsg.role !== "user") return;

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setInput(userMsg.content);
    setTimeout(() => handleSend(), 100);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = {
      id: nanoid(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const assistantId = nanoid();
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: [],
      relevantFiles: [],
    };
    setMessages((prev) => [...prev, assistantMessage]);

    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          chatId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Chat request failed");
      }

      if (data?.chatId && data.chatId !== chatId) {
        setChatId(data.chatId);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: data?.response || "No response generated.",
                relevantFiles: data?.relevantFiles || [],
                intent: data?.intent || "explain",
              }
            : msg,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Something went wrong.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  "Sorry, I couldn't complete that request. Please try again.",
                sources: [],
                relevantFiles: [],
              }
            : msg,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 h-[calc(100vh-var(--header-height))] overflow-hidden">
          {/* Chat History Sidebar */}
          <ChatHistorySidebar
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            currentChatId={chatId}
            isCollapsed={historyCollapsed}
            onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
          />

          {/* Main Chat Area */}
          <div className="flex flex-col flex-1 gap-4 py-4 md:gap-6 md:py-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 lg:px-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Skooly AI
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ask anything about your course materials
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/30">
                <span className={`size-2 rounded-full ${FIXED_MODEL.color}`} />
                <span className="text-xs font-semibold text-muted-foreground">
                  {FIXED_MODEL.name}
                </span>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden relative border-t border-border mt-2">
              <ScrollArea
                ref={scrollAreaRef}
                className="h-full px-4 lg:px-6 py-8 no-scrollbar"
              >
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Welcome Screen */}
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6"
                    >
                      <div className="size-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                        <IconBrain className="size-10 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                          Welcome to Skooly AI
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Your intelligent learning companion. Ask questions
                          about your course materials and get instant answers
                          with sources.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mt-6">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => setInput(s)}
                            className="px-4 py-2 rounded-full bg-muted/50 border border-border text-sm hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Messages */}
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`shrink-0 size-8 rounded-full flex items-center justify-center border shadow-none ${msg.role === "assistant" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"}`}
                      >
                        {msg.role === "assistant" ? (
                          <IconRobot className="size-4" />
                        ) : (
                          <IconUser className="size-4" />
                        )}
                      </div>
                      <div
                        className={`flex flex-col gap-3 flex-1 ${msg.role === "user" ? "items-end" : ""}`}
                      >
                        <div
                          className={`p-4 rounded-2xl text-sm leading-relaxed border shadow-none w-full ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground border-primary rounded-tr-none max-w-[85%]"
                              : "bg-muted/30 text-foreground border-border rounded-tl-none"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({
                                  node,
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }) {
                                  const match = /language-(\w+)/.exec(
                                    className || "",
                                  );
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-lg my-2"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code
                                      className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-2 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside mb-2 space-y-1">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="ml-2">{children}</li>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold mb-2 mt-4">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-bold mb-2 mt-3">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-bold mb-2 mt-2">
                                    {children}
                                  </h3>
                                ),
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline hover:text-primary/80"
                                  >
                                    {children}
                                  </a>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2 text-muted-foreground">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </div>

                        {/* Assistant Actions */}
                        {msg.role === "assistant" && msg.content && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => copyToClipboard(msg.content)}
                            >
                              <IconCopy className="size-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => regenerateResponse(msg.id)}
                              disabled={isStreaming}
                            >
                              <IconRefresh className="size-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        )}

                        {/* Files Section - Always visible for search, collapsible for explain */}
                        {msg.role === "assistant" &&
                          msg.relevantFiles?.length > 0 && (
                            <div className="w-full">
                              {msg.intent === "search" ? (
                                // Search intent: show files directly
                                <div className="grid grid-cols-1 gap-2 mt-2">
                                  {msg.relevantFiles.map((file, idx) => (
                                    <a
                                      key={file.id || idx}
                                      href={file.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group rounded-xl border border-border bg-card p-3 text-xs hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3"
                                    >
                                      <div className="shrink-0 size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <IconFileText className="size-5 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-foreground group-hover:text-primary transition">
                                          {file.title || "Untitled Document"}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                          <span>{file.category}</span>
                                          {file.topic && (
                                            <span>• {file.topic}</span>
                                          )}
                                          {file.week && (
                                            <span>• Week {file.week}</span>
                                          )}
                                        </div>
                                      </div>
                                      <IconExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition" />
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                // Explain intent: collapsible sources
                                <>
                                  <button
                                    onClick={() => toggleSources(msg.id)}
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 hover:text-primary transition-colors"
                                  >
                                    <IconFileText className="size-3" />
                                    <span>
                                      Sources ({msg.relevantFiles.length})
                                    </span>
                                    {expandedSources[msg.id] ? (
                                      <IconChevronUp className="size-3" />
                                    ) : (
                                      <IconChevronDown className="size-3" />
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {expandedSources[msg.id] && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                          {msg.relevantFiles.map(
                                            (file, idx) => (
                                              <a
                                                key={file.id || idx}
                                                href={file.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group rounded-xl border border-border bg-card p-3 text-xs hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3"
                                              >
                                                <div className="shrink-0 size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                  <IconFileText className="size-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-semibold truncate text-foreground group-hover:text-primary transition">
                                                    {file.title ||
                                                      "Untitled Document"}
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <span>{file.category}</span>
                                                    {file.week && (
                                                      <span>
                                                        • Week {file.week}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                <IconExternalLink className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                                              </a>
                                            ),
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </>
                              )}
                            </div>
                          )}

                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter px-1 opacity-70">
                          {msg.role === "user" ? "You" : "Skooly AI"}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading State */}
                  {isStreaming && (
                    <div className="flex gap-4">
                      <div className="shrink-0 size-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground border border-primary shadow-none">
                        <IconRobot className="size-4" />
                      </div>
                      <div className="bg-muted/30 p-4 rounded-2xl rounded-tl-none border border-border shadow-none">
                        <IconLoader className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Simplified Input Area */}
            <div className="p-4 lg:px-6 bg-background/50 backdrop-blur-md border-t border-border">
              <div className="max-w-3xl mx-auto space-y-3">
                {/* Suggestion chips - only show when no messages */}
                {!isStreaming && messages.length > 0 && messages.length < 4 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {suggestions.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-medium text-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleSend}
                  className="relative bg-muted/20 border border-border rounded-2xl focus-within:border-primary/30 transition-all overflow-hidden"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask Skooly anything about your courses..."
                    className="w-full bg-transparent border-none focus:ring-0 p-4 pb-12 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[100px] max-h-[200px]"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      <IconPlus className="size-4 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      <IconMicrophone className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <Button
                      type="submit"
                      size="icon"
                      className="size-9 rounded-xl bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
                      disabled={!input.trim() || isStreaming}
                    >
                      <IconSend className="size-4" />
                    </Button>
                  </div>
                </form>
                <p className="text-[9px] text-center text-muted-foreground font-medium opacity-60">
                  Skooly AI uses your course materials to answer questions.
                  Verify important info with your syllabus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

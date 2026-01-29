"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { ChatHistorySidebar } from "@/app/components/chat/ChatHistorySidebar";
import { ChatBubble, ChatBubbleLoading } from "@/app/components/chat/ChatBubble";
import {
  IconSend,
  IconPlus,
  IconMicrophone,
  IconBrain,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
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
  const [evaluatingId, setEvaluatingId] = useState(null);

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
          data.chat.messages.map((m) => ({
            id: nanoid(),
            role: m.role,
            content: m.content,
            relevantFiles: m.sources || [],
            intent: m.intent || "explain",
            validation: m.validation,
          })),
        );
        setExpandedSources({});
      }
    } catch {
      toast.error("Failed to load chat");
    }
  };

  const handleEvaluate = async (messageId) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx <= 0) return;
    const prev = messages[idx - 1];
    if (prev?.role !== "user") return;
    const assistant = messages[idx];
    if (assistant?.role !== "assistant" || !assistant?.content) return;

    setEvaluatingId(messageId);
    try {
      const res = await fetch("/api/chat/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: prev.content,
          assistantContent: assistant.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Evaluation failed");

      setMessages((prevMsgs) =>
        prevMsgs.map((m) =>
          m.id === messageId ? { ...m, validation: data.validation } : m,
        ),
      );
      toast.success("Evaluation complete");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Evaluation failed");
    } finally {
      setEvaluatingId(null);
    }
  };

  const regenerateResponse = async (messageId) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    const userMsg = messages[msgIndex - 1];
    if (userMsg.role !== "user") return;

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    handleSend(null, { regenerate: true, regenerateContent: userMsg.content });
  };

  const handleSend = async (e, opts = {}) => {
    e?.preventDefault();
    const { regenerate = false, regenerateContent } = opts;
    const text = regenerate ? regenerateContent?.trim() : input.trim();
    if (!text || isStreaming) return;

    if (!regenerate) {
      const userMessage = { id: nanoid(), role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }

    const assistantId = nanoid();
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      relevantFiles: [],
      intent: "explain",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
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
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Something went wrong.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  "Sorry, I couldn't complete that request. Please try again.",
                relevantFiles: [],
              }
            : msg,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  /** Last message is placeholder assistant while streaming. */
  const lastIsStreamingPlaceholder =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    !messages[messages.length - 1]?.content;

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
          <ChatHistorySidebar
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            currentChatId={chatId}
            isCollapsed={historyCollapsed}
            onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
          />

          <div className="flex flex-col flex-1 gap-4 py-4 md:gap-6 md:py-6 overflow-hidden">
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
                <span
                  className={`size-2 rounded-full ${FIXED_MODEL.color}`}
                  aria-hidden
                />
                <span className="text-xs font-semibold text-muted-foreground">
                  {FIXED_MODEL.name}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative border-t border-border mt-2">
              <ScrollArea
                ref={scrollAreaRef}
                className="h-full px-4 lg:px-6 py-8 no-scrollbar"
              >
                <div className="max-w-3xl mx-auto space-y-8">
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
                            type="button"
                            onClick={() => setInput(s)}
                            className="px-4 py-2 rounded-full bg-muted/50 border border-border text-sm hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {messages.map((msg) => {
                    const isPlaceholder =
                      lastIsStreamingPlaceholder && msg.id === messages[messages.length - 1]?.id;

                    if (isPlaceholder) {
                      return <ChatBubbleLoading key={msg.id} />;
                    }

                    return (
                      <ChatBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        id={msg.id}
                        relevantFiles={msg.relevantFiles}
                        intent={msg.intent}
                        sourcesExpanded={expandedSources[msg.id]}
                        onToggleSources={() => toggleSources(msg.id)}
                        onCopy={
                          msg.role === "assistant" && msg.content
                            ? () => copyToClipboard(msg.content)
                            : undefined
                        }
                        onRegenerate={
                          msg.role === "assistant"
                            ? () => regenerateResponse(msg.id)
                            : undefined
                        }
                        onEvaluate={
                          msg.role === "assistant" && msg.content
                            ? () => handleEvaluate(msg.id)
                            : undefined
                        }
                        isStreaming={isStreaming}
                        isEvaluating={evaluatingId === msg.id}
                        validation={msg.validation}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="p-4 lg:px-6 bg-background/50 backdrop-blur-md border-t border-border">
              <div className="max-w-3xl mx-auto space-y-3">
                {!isStreaming &&
                  messages.length > 0 &&
                  messages.length < 4 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {suggestions.slice(0, 3).map((s) => (
                        <button
                          key={s}
                          type="button"
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
                        handleSend(e);
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
                      aria-label="Add attachment"
                    >
                      <IconPlus className="size-4 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                      aria-label="Voice input"
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
                      aria-label="Send"
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

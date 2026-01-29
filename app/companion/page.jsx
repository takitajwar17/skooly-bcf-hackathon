"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  IconSend,
  IconPlus,
  IconMicrophone,
  IconWorld,
  IconCheck,
  IconChevronDown,
  IconRobot,
  IconUser,
  IconLoader,
  IconSearch,
  IconSparkles,
  IconBrain
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/app/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { toast } from "sonner";

const models = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", color: "bg-chart-1" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", color: "bg-chart-2" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", color: "bg-chart-3" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", color: "bg-chart-4" },
];

const initialMessages = [
  {
    id: nanoid(),
    role: "user",
    content: "Can you explain how to use React hooks effectively?",
  },
  {
    id: nanoid(),
    role: "assistant",
    content: "React hooks are a powerful feature that let you use state and other React features without writing classes. \n\nKey rules include only calling them at the top level and only within React functions. Common hooks like `useState`, `useEffect`, and `useMemo` help manage state and performance efficiently.",
  }
];

const suggestions = [
  "Explain quantum computing",
  "Best practices for React",
  "How to optimize DB queries?",
  "What is NoSQL?",
];

const mockResponses = [
  "That's a great question! Let me help you understand this concept better. The key thing to remember is that proper implementation requires careful consideration of the underlying principles.",
  "I'd be happy to explain this topic in detail. There are several important factors to consider when approaching this problem. Let me break it down step by step for you.",
  "This is an interesting topic! The solution typically involves understanding the core concepts and applying them in the right context.",
];

export default function CompanionPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef(null);
  const [useWebSearch, setUseWebSearch] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = {
      id: nanoid(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Simulate Assistant Response
    setTimeout(async () => {
      const assistantId = nanoid();
      const assistantMessage = {
        id: assistantId,
        role: "assistant",
        content: "...",
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      setIsStreaming(true);
      const words = randomResponse.split(" ");
      let currentText = "";
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? " " : "") + words[i];
        setMessages(prev => prev.map(msg => 
          msg.id === assistantId ? { ...msg, content: currentText } : msg
        ));
        await new Promise(r => setTimeout(r, 40));
      }
      setIsStreaming(false);
    }, 600);
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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col h-[calc(100vh-var(--header-height))] overflow-hidden">
          <div className="flex flex-col flex-1 gap-4 py-4 md:gap-6 md:py-6 overflow-hidden">
            
            {/* Consistent Header Area */}
            <div className="flex items-center justify-between px-4 lg:px-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Skooly AI</h1>
                <p className="text-sm text-muted-foreground">Master your curriculum with your personal AI tutor.</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 border shadow-none bg-background text-foreground">
                    <span className={`size-2 rounded-full ${selectedModel.color}`} />
                    <span className="text-xs font-semibold">{selectedModel.name}</span>
                    <IconChevronDown className="size-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover text-popover-foreground border-border">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuGroup>
                    {models.map((m) => (
                      <DropdownMenuItem 
                        key={m.id} 
                        onClick={() => setSelectedModel(m)}
                        className="flex items-center justify-between py-2 focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${m.color}`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{m.name}</span>
                            <span className="text-[10px] text-muted-foreground">{m.provider}</span>
                          </div>
                        </div>
                        {selectedModel.id === m.id && <IconCheck className="size-4 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden relative border-t border-border mt-2">
              <ScrollArea ref={scrollAreaRef} className="h-full px-4 lg:px-6 py-8 no-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`shrink-0 size-8 rounded-full flex items-center justify-center border shadow-none ${msg.role === "assistant" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"}`}>
                        {msg.role === "assistant" ? <IconRobot className="size-4" /> : <IconUser className="size-4" />}
                      </div>
                      <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : ""}`}>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed border shadow-none ${ 
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground border-primary rounded-tr-none"
                            : "bg-muted/30 text-foreground border-border rounded-tl-none"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter px-1 opacity-70">
                          {msg.role === "user" ? "You" : "Skooly AI"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
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

            {/* Input Area */}
            <div className="p-4 lg:px-6 bg-background/50 backdrop-blur-md border-t border-border">
              <div className="max-w-3xl mx-auto space-y-4">
                
                {/* Suggestions */}
                {!isStreaming && messages.length < 4 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); }}
                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-bold uppercase tracking-wider text-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all shadow-none"
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
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask Skooly anything about your courses..."
                    className="w-full bg-transparent border-none focus:ring-0 p-4 pb-12 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[100px] max-h-[200px]"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <IconPlus className="size-4 text-muted-foreground" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <IconMicrophone className="size-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      type="button" 
                      variant={useWebSearch ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setUseWebSearch(!useWebSearch)}
                      className={`h-8 gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${useWebSearch ? "bg-primary/10 text-primary border-none shadow-none" : "text-muted-foreground shadow-none"}`}
                    >
                      <IconWorld className="size-3.5" />
                      Web Search
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
                <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-tighter opacity-60">
                  Skooly AI may provide inaccurate info. Verify with your syllabus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
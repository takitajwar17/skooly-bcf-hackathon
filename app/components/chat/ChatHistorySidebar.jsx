"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  IconPlus,
  IconMessage,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function ChatHistorySidebar({
  onNewChat,
  onSelectChat,
  currentChatId,
  isCollapsed,
  onToggleCollapse,
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chat");
      const data = await response.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentChatId]);

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat?chatId=${chatId}`, { method: "DELETE" });
      setChats(chats.filter((c) => c._id !== chatId));
      if (currentChatId === chatId) {
        onNewChat();
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-card/50 flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="size-8"
        >
          <IconChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="size-8"
        >
          <IconPlus className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Chat History</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="size-7"
          >
            <IconPlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="size-7"
          >
            <IconChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              Loading...
            </div>
          ) : chats.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No chat history yet
            </div>
          ) : (
            <AnimatePresence>
              {chats.map((chat) => (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => onSelectChat(chat._id)}
                  className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    currentChatId === chat._id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <IconMessage className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {chat.title || "New Chat"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(chat.updatedAt || chat.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteChat(chat._id, e)}
                    className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <IconTrash className="size-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

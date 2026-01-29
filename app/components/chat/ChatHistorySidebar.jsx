"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Spinner } from "@/app/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
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
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  /**
   * Closes delete dialog and resets state
   */
  const handleDialogClose = (open) => {
    if (!open) {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  /**
   * Fetches chat history from the API
   * Updates local state with fetched chats
   */
  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chat");
      const data = await response.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect hook to fetch chats when currentChatId changes
   * Ensures chat list stays in sync with active chat
   */
  useEffect(() => {
    fetchChats();
  }, [currentChatId]);

  /**
   * Opens delete confirmation dialog
   * Prevents event propagation to avoid triggering chat selection
   */
  const handleDeleteClick = (chatId, e) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  /**
   * Deletes a chat after confirmation
   * Shows loading state during deletion
   * Updates local state optimistically
   * Handles cleanup if deleted chat was active
   */
  const deleteChat = async () => {
    if (!chatToDelete) return;

    setDeletingChatId(chatToDelete);
    setDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/chat?chatId=${chatToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to delete chat");
      }

      // Optimistically update UI with smooth transition
      setChats((prevChats) => prevChats.filter((c) => c._id !== chatToDelete));

      // If deleted chat was active, start new chat
      if (currentChatId === chatToDelete) {
        onNewChat();
      }

      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error(error.message || "Failed to delete chat");
      // Refresh chat list on error to ensure consistency
      fetchChats();
    } finally {
      setDeletingChatId(null);
      setChatToDelete(null);
    }
  };

  /**
   * Formats date relative to current time
   * Returns human-readable relative time strings
   */
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-8"
            >
              <Spinner className="size-5 text-muted-foreground" />
            </motion.div>
          ) : chats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground text-center py-8"
            >
              No chat history yet
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {chats.map((chat) => (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: -20, 
                    scale: 0.95,
                    transition: {
                      duration: 0.2,
                    }
                  }}
                  layout
                  onClick={() => {
                    if (deletingChatId !== chat._id) {
                      onSelectChat(chat._id);
                    }
                  }}
                  className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all duration-200 relative ${
                    currentChatId === chat._id
                      ? "bg-primary/10 border border-primary/20 shadow-sm"
                      : "hover:bg-muted/50 border border-transparent"
                  } ${deletingChatId === chat._id ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <IconMessage className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs font-medium truncate max-w-[140px]" title={chat.title || "New Chat"}>
                      {chat.title || "New Chat"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                      {formatDate(chat.updatedAt || chat.createdAt)}
                    </p>
                  </div>
                  {deletingChatId === chat._id ? (
                    <Spinner className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(chat._id, e)}
                      className="size-7 shrink-0 transition-all duration-200 hover:bg-destructive/10 active:scale-95"
                      title="Delete chat"
                    >
                      <IconTrash className="size-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleDialogClose(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

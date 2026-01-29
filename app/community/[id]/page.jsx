"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  IconLoader,
  IconChevronLeft,
  IconSend,
  IconRobot,
  IconUser,
  IconSparkles,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function CommunityPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const [hasBotReply, setHasBotReply] = useState(false);

  const fetchPost = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/community/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const data = json.data;
      setPost(data);
      setReplies(data?.replies || []);
      setMaterial(data?.material || null);
      setHasBotReply(
        (data?.replies || []).some((r) => r.isBot)
      );
    } catch (e) {
      toast.error("Could not load discussion.");
      setPost(null);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleAddReply = async (e) => {
    e?.preventDefault();
    const content = replyContent.trim();
    if (!content) {
      toast.error("Reply cannot be empty.");
      return;
    }
    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/community/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          authorName:
            user?.fullName ||
            user?.firstName ||
            user?.username ||
            "Anonymous",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to add reply");
      }
      const json = await res.json();
      setReplies((prev) => [...prev, json.data]);
      setReplyContent("");
      toast.success("Reply posted.");
    } catch (err) {
      toast.error(err?.message || "Failed to add reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleGetAIHelp = async () => {
    setBotLoading(true);
    try {
      const res = await fetch(`/api/community/${id}/bot-reply`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to get AI help");
      }
      const json = await res.json();
      if (json.data) {
        setReplies((prev) => [...prev, json.data]);
        setHasBotReply(true);
        toast.success("Skooly Bot replied.");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to get AI help");
    } finally {
      setBotLoading(false);
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
          <div className="flex flex-1 justify-center items-center">
            <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!post) {
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">Discussion not found.</p>
            <Button onClick={() => router.back()} variant="outline">
              Go back
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
      <SidebarInset className="overflow-hidden flex flex-col h-screen">
        <SiteHeader />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 -ml-2"
                  onClick={() => router.push("/community")}
                >
                  <IconChevronLeft className="size-4" />
                </Button>
                <Link
                  href="/community"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Community
                </Link>
              </div>

              {/* Post */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className="border shadow-none overflow-hidden">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {post.mentions?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {post.mentions.join(", ")}
                        </Badge>
                      )}
                      {material && (
                        <Badge variant="outline" className="text-xs" asChild>
                          <Link href={`/materials/${material._id}`}>
                            {material.title}
                            <IconExternalLink className="size-3 ml-1" />
                          </Link>
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-semibold">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <IconUser className="size-3" />
                        {post.authorName}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-foreground">
                      {post.body}
                    </p>
                  </CardContent>
                </Card>

                {/* Get AI help — when intended receiver unavailable */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    Instructor or TA unavailable? Get an instant reply from Skooly Bot.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 w-fit"
                    onClick={handleGetAIHelp}
                    disabled={botLoading || hasBotReply}
                  >
                    {botLoading ? (
                      <IconLoader className="size-4 animate-spin" />
                    ) : (
                      <IconSparkles className="size-4" />
                    )}
                    {hasBotReply
                      ? "Skooly Bot already replied"
                      : "Get AI help"}
                  </Button>
                </div>
              </motion.div>

              {/* Replies */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Replies ({replies.length})
                </h3>
                {replies.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No replies yet. Add one below or get AI help.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {replies.map((r, i) => (
                        <motion.div
                          key={r._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "rounded-lg border p-4 shadow-none",
                            r.isBot
                              ? "bg-primary/5 border-primary/20"
                              : "bg-muted/20 border-border"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={cn(
                                "flex items-center justify-center size-8 rounded-full border",
                                r.isBot
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-muted border-border"
                              )}
                            >
                              {r.isBot ? (
                                <IconRobot className="size-4" />
                              ) : (
                                <IconUser className="size-4" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">
                                {r.authorName}
                              </span>
                              {r.isBot && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-normal"
                                >
                                  AI
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(r.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="pl-10 text-sm text-foreground [&_p]:my-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
                            <ReactMarkdown>{r.content}</ReactMarkdown>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Add reply */}
              <Card className="border shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Add a reply</CardTitle>
                  <CardDescription>
                    Help others or add a follow-up. Only human replies here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleAddReply}
                    className="flex flex-col gap-3"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="reply-content" className="sr-only">
                        Your reply
                      </Label>
                      <Textarea
                        id="reply-content"
                        placeholder="Write your reply…"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={4}
                        className="bg-background resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      className="gap-2 w-fit"
                      disabled={
                        !replyContent.trim() || replySubmitting
                      }
                    >
                      {replySubmitting ? (
                        <IconLoader className="size-4 animate-spin" />
                      ) : (
                        <IconSend className="size-4" />
                      )}
                      Post reply
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AppSidebar,
} from "@/app/components/dashboard/app-sidebar";
import { SiteHeader } from "@/app/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  IconLoader,
  IconPlus,
  IconMessageCircle,
  IconRobot,
  IconUser,
  IconArrowRight,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [mentionInstructor, setMentionInstructor] = useState(false);
  const [mentionTA, setMentionTA] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setPosts(json.data || []);
    } catch (e) {
      toast.error("Could not load community posts.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e?.preventDefault();
    if (!createTitle.trim() || !createBody.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle.trim(),
          postBody: createBody.trim(),
          authorName:
            user?.fullName ||
            user?.firstName ||
            user?.username ||
            "Anonymous",
          mentions: [
            ...(mentionInstructor ? ["@instructor"] : []),
            ...(mentionTA ? ["@TA"] : []),
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create post");
      }
      const json = await res.json();
      toast.success("Post created.");
      setCreateOpen(false);
      setCreateTitle("");
      setCreateBody("");
      setMentionInstructor(false);
      setMentionTA(false);
      setPosts((prev) => [json.data, ...prev]);
    } catch (err) {
      toast.error(err?.message || "Failed to create post");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const filtered = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.body?.toLowerCase().includes(search.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2 overflow-hidden">
            <ScrollArea className="flex-1 no-scrollbar">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex items-center justify-between px-4 lg:px-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Community
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Discuss problems, ask questions, and get AI help when
                      instructors or TAs are unavailable.
                    </p>
                  </div>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <IconPlus className="size-4" />
                        New post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>New discussion post</DialogTitle>
<DialogDescription>
                        Share a question or topic. Mark who you’re asking—Skooly
                        Bot can reply when they’re unavailable.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleCreatePost}
                      className="flex flex-col gap-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="community-title">Title</Label>
                        <Input
                          id="community-title"
                          placeholder="e.g. Confusion about Week 3 normalization"
                          value={createTitle}
                          onChange={(e) => setCreateTitle(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="community-body">What’s on your mind?</Label>
                        <Textarea
                          id="community-body"
                          placeholder="Describe your question or topic."
                          value={createBody}
                          onChange={(e) => setCreateBody(e.target.value)}
                          rows={5}
                          className="bg-background resize-none"
                        />
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="mention-instructor"
                            checked={mentionInstructor}
                            onCheckedChange={(v) =>
                              setMentionInstructor(!!v)
                            }
                          />
                          <Label
                            htmlFor="mention-instructor"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Asking @instructor
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="mention-ta"
                            checked={mentionTA}
                            onCheckedChange={(v) => setMentionTA(!!v)}
                          />
                          <Label
                            htmlFor="mention-ta"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Asking @TA
                          </Label>
                        </div>
                      </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              !createTitle.trim() ||
                              !createBody.trim() ||
                              createSubmitting
                            }
                          >
                            {createSubmitting ? (
                              <IconLoader className="size-4 animate-spin" />
                            ) : (
                              "Post"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="px-4 lg:px-6">
                  <div className="relative max-w-sm">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      className="pl-9 h-9 bg-muted border-border"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-1 justify-center items-center py-24">
                    <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 px-4">
                    <div className="rounded-full bg-muted p-4">
                      <IconMessageCircle className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No posts yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      Start a discussion or ask a question. Use &quot;Get AI help&quot; on
                      any post when your instructor or TA can’t respond.
                    </p>
                    <Button
                      onClick={() => setCreateOpen(true)}
                      className="gap-2"
                    >
                      <IconPlus className="size-4" />
                      New post
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 px-4 lg:px-6 max-w-3xl">
                    <AnimatePresence mode="popLayout">
                      {filtered.map((post, index) => (
                        <motion.div
                          key={post._id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card
                            className={cn(
                              "cursor-pointer transition-all duration-200 border shadow-none",
                              "hover:border-primary/30 hover:bg-muted/20"
                            )}
                            onClick={() =>
                              router.push(`/community/${post._id}`)
                            }
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                                  {post.title}
                                </CardTitle>
                                <IconArrowRight className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                              </div>
                              <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <IconUser className="size-3" />
                                  {post.authorName}
                                </span>
                                <span>
                                  {formatDistanceToNow(
                                    new Date(post.createdAt),
                                    { addSuffix: true }
                                  )}
                                </span>
                                {post.mentions?.length > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-normal"
                                  >
                                    {post.mentions.join(", ")}
                                  </Badge>
                                )}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="py-0">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.body}
                              </p>
                            </CardContent>
                            <CardFooter className="pt-3 text-muted-foreground">
                              <span className="text-xs">
                                View discussion →
                              </span>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

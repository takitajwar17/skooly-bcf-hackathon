"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  FileText,
  BookOpen,
  Code,
  File,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/app/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar"
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("search");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedResults, setExpandedResults] = useState(new Set());

  const performSearch = async (searchQuery, searchMode) => {
    if (!searchQuery?.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim(),
          mode: searchMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL params (?q=, ?mode=) and auto-search when present
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const urlMode = searchParams.get("mode");
    if (urlQuery) {
      setQuery(urlQuery);
      if (urlMode && ["search", "rag"].includes(urlMode)) setMode(urlMode);
      performSearch(urlQuery, urlMode || "search");
    }
  }, [searchParams]);

  const toggleExpand = (id) => {
    setExpandedResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "code":
        return <Code className="w-5 h-5" />;
      case "slide":
        return <BookOpen className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const handleNewSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Update URL without page reload
    const searchParams = new URLSearchParams({
      q: query.trim(),
      mode: mode
    });
    window.history.pushState({}, '', `/search?${searchParams.toString()}`);
    
    // Perform search
    await performSearch(query, mode);
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Search</h1>
            {query && (
              <p className="text-muted-foreground">
                Results for &quot;{query}&quot; in {mode === "rag" ? "AI" : "Search"} mode
              </p>
            )}
          </div>

          {/* New Search Form */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <form onSubmit={handleNewSearch} className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMode("search")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    mode === "search"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setMode("rag")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    mode === "rag"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI
                </button>
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your search query..."
                    className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-lg text-muted-foreground">Searching...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl mb-8"
              >
                <p className="font-medium">Error: {error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Display */}
          <AnimatePresence>
            {results && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-8"
              >
                {/* RAG Response */}
                {mode === "rag" && results.response && (
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">
                        AI Response
                      </h2>
                    </div>
                    <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {results.response}
                    </div>
                    {results.filesProcessed > 0 && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        📄 Processed {results.filesProcessed} file(s)
                      </div>
                    )}
                  </div>
                )}

                {/* Sources/Results */}
                {results.citations && results.citations.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {mode === "rag" ? "Sources" : "Search Results"} ({results.citations.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.citations.map((citation, idx) => {
                        const isExpanded = expandedResults.has(
                          citation.id || `citation-${idx}`,
                        );
                        const shortSnippet =
                          citation.text?.substring(0, 150) || "";
                        const hasMore = citation.text?.length > 150;

                        return (
                          <motion.div
                            key={citation.id || idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-background/80 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                          >
                            <div className="p-5 flex-1">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                                    {getFileIcon(citation.materialType)}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                                      {citation.title || `Source ${idx + 1}`}
                                    </h4>
                                    <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                                      {citation.materialTopic && (
                                        <span className="bg-muted px-2 py-0.5 rounded-full">{citation.materialTopic}</span>
                                      )}
                                      {citation.materialWeek && (
                                        <span className="bg-muted px-2 py-0.5 rounded-full">Week {citation.materialWeek}</span>
                                      )}
                                      <span className="uppercase">{citation.materialType || "Document"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Snippet */}
                              <p
                                className={`text-sm text-foreground/70 leading-relaxed ${!isExpanded && "line-clamp-3"}`}
                              >
                                {isExpanded ? citation.text : shortSnippet}
                                {!isExpanded && hasMore && "..."}
                              </p>

                              {/* Expand button */}
                              {hasMore && (
                                <button
                                  onClick={() => toggleExpand(citation.id || `citation-${idx}`)}
                                  className="mt-3 text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      Show less{" "}
                                      <ChevronUp className="w-3 h-3" />
                                    </>
                                  ) : (
                                    <>
                                      Show more{" "}
                                      <ChevronDown className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            
                            {/* Action Link */}
                            {citation.materialId && (
                              <div className="px-5 py-3 bg-muted/30 border-t border-border mt-auto">
                                <Link 
                                  href={`/materials/${citation.materialId}`}
                                  className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5"
                                >
                                  View Full Material
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {results.citations && results.citations.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 bg-muted/50 rounded-full mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or switch to AI mode
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State (no search performed yet) */}
          {!results && !loading && !error && query && (
            <div className="text-center py-16">
              <div className="inline-flex p-6 bg-primary/10 rounded-full mb-4">
                <Search className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Ready to search
              </h3>
              <p className="text-muted-foreground">
                Enter a query above to get started
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

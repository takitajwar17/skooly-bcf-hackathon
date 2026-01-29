"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchTestPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("search"); // "search" or "rag"
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedResults, setExpandedResults] = useState(new Set());

  const categories = [
    { value: "", label: "All Categories" },
    { value: "lecture", label: "Lectures" },
    { value: "assignment", label: "Assignments" },
    { value: "lab", label: "Labs" },
    { value: "reference", label: "References" },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          category: category || undefined,
          mode,
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
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "code":
        return <Code className="w-5 h-5" />;
      case "text":
        return <BookOpen className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      lecture: "bg-primary/10 text-primary border-primary/20",
      assignment: "bg-accent/10 text-accent-foreground border-accent/20",
      lab: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      reference: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    };
    return colors[cat] || "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
            RAG Search Testing
          </h1>
          <p className="text-muted-foreground text-lg">
            Test semantic search and AI-augmented responses
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => setMode("search")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  mode === "search"
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Search className="w-5 h-5" />
                Semantic Search
              </button>
              <button
                type="button"
                onClick={() => setMode("rag")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  mode === "rag"
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Sparkles className="w-5 h-5" />
                RAG Mode
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query..."
                className="w-full pl-12 pr-4 py-4 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  Search
                </span>
              )}
            </button>
          </form>
        </motion.div>

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
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* RAG Response */}
              {mode === "rag" && results.response && (
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
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

              {/* Sources (RAG mode) */}
              {mode === "rag" &&
                results.citations &&
                results.citations.length > 0 && (
                  <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Sources ({results.citations.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {results.citations.map((citation, idx) => {
                        const isExpanded = expandedResults.has(
                          `citation-${idx}`,
                        );
                        const shortSnippet =
                          citation.text?.substring(0, 150) || "";
                        const hasMore = citation.text?.length > 150;

                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-background/80 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
                            onClick={() =>
                              hasMore && toggleExpand(`citation-${idx}`)
                            }
                          >
                            <div className="p-4">
                              {/* Header */}
                              <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                                  <BookOpen className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                                    {citation.title || `Source ${idx + 1}`}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    Document {idx + 1}
                                  </p>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(`citation-${idx}`);
                                  }}
                                  className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
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
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Search Results */}
              {mode === "search" && results.citations && (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    Search Results ({results.citations.length})
                  </h3>
                  {results.citations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No results found. Try a different query.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {results.citations.map((citation, idx) => {
                        const isExpanded = expandedResults.has(citation.id);
                        const shortSnippet =
                          citation.text?.substring(0, 150) || "";
                        const hasMore = citation.text?.length > 150;

                        return (
                          <motion.div
                            key={citation.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-background/80 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
                            onClick={() => hasMore && toggleExpand(citation.id)}
                          >
                            <div className="p-4">
                              {/* Header */}
                              <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                                  <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                                    {citation.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    Document {idx + 1}
                                  </p>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(citation.id);
                                  }}
                                  className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
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
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!results && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="inline-flex p-6 bg-primary/10 rounded-full mb-4">
              <Search className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Ready to search
            </h3>
            <p className="text-muted-foreground">
              Enter a query above to test the RAG search system
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

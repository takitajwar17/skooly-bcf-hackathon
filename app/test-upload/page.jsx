"use client";

import { useState } from "react";

export default function TestUploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("search");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", e.target.title.value || file.name);
    formData.append("category", e.target.category.value);
    formData.append("topic", e.target.topic.value);
    formData.append("week", e.target.week.value);
    formData.append("tags", e.target.tags.value);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setSearching(true);
    setSearchResult(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          mode: searchMode,
        }),
      });

      const data = await res.json();
      setSearchResult(data);
    } catch (error) {
      setSearchResult({ error: error.message });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">RAG System Test Interface</h1>

        {/* Upload Section */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold mb-4">Upload Material</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full p-2 border rounded"
                accept=".pdf,.txt,.py,.js,.java,.cpp,.docx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Material title"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select name="category" className="w-full p-2 border rounded">
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Week</label>
                <input
                  type="number"
                  name="week"
                  defaultValue="1"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Topic</label>
              <input
                type="text"
                name="topic"
                placeholder="e.g., Python Functions"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                placeholder="python,functions,basics"
                className="w-full p-2 border rounded"
              />
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-primary text-primary-foreground p-3 rounded font-medium disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Material"}
            </button>
          </form>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold mb-4">Test Search & RAG</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., how to define a function in python"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="search"
                    checked={searchMode === "search"}
                    onChange={(e) => setSearchMode(e.target.value)}
                  />
                  <span>Semantic Search</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="rag"
                    checked={searchMode === "rag"}
                    onChange={(e) => setSearchMode(e.target.value)}
                  />
                  <span>RAG Response</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!searchQuery || searching}
              className="w-full bg-primary text-primary-foreground p-3 rounded font-medium disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {searchResult && (
            <div className="mt-4 p-4 bg-muted rounded">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(searchResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { IconFileText, IconExternalLink } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Link card for a relevant course material (source) in chat.
 * Used in search results (prominent) and explain sources (compact).
 *
 * @param {Object} file - { id?, _id?, fileUrl, title?, category?, topic?, week? }
 * @param {boolean} compact - Smaller layout for collapsible explain list
 * @param {string} className - Optional extra classes
 */
export function SourceCard({ file, compact = false, className }) {
  const id = file?.id ?? file?._id;
  const href = file?.fileUrl || "#";
  const title = file?.title || "Untitled Document";

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs transition-all",
        "hover:border-primary/50 hover:bg-primary/5",
        compact && "p-2.5 gap-2",
        className
      )}
    >
      <div
        className={cn(
          "shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary",
          compact ? "size-8" : "size-10"
        )}
      >
        <IconFileText className={compact ? "size-4" : "size-5"} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-semibold text-foreground truncate transition-colors group-hover:text-primary",
            compact && "text-[11px]"
          )}
        >
          {title}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 text-muted-foreground mt-0.5 flex-wrap",
            compact ? "text-[10px]" : "text-[10px]"
          )}
        >
          {file?.category && <span>{file.category}</span>}
          {file?.topic && (
            <>
              <span className="opacity-60">•</span>
              <span>{file.topic}</span>
            </>
          )}
          {file?.week != null && (
            <>
              <span className="opacity-60">•</span>
              <span>Week {file.week}</span>
            </>
          )}
        </div>
      </div>
      <IconExternalLink
        className={cn(
          "shrink-0 text-muted-foreground transition-colors group-hover:text-primary",
          compact ? "size-3.5 opacity-0 group-hover:opacity-100" : "size-4"
        )}
      />
    </a>
  );
}

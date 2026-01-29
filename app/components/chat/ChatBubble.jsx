"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconUser,
  IconRobot,
  IconCopy,
  IconRefresh,
  IconFileText,
  IconChevronDown,
  IconChevronUp,
  IconLoader,
  IconClipboardCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ValidationBadge } from "@/app/components/chat/ValidationBadge";
import { SourceCard } from "@/app/components/chat/SourceCard";

/** Markdown component map for assistant messages. Uses semantic tokens only. */
const markdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    if (!inline && match) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          className="!rounded-lg !my-2 !text-xs"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      );
    }
    return (
      <code
        className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="ml-2">{children}</li>,
  h1: ({ children }) => (
    <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0">{children}</h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:text-primary/80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2 text-muted-foreground">
      {children}
    </blockquote>
  ),
};

/**
 * Single chat message bubble: user or assistant.
 * Assistant supports markdown, sources (search / explain), validation, copy, regenerate.
 *
 * @param {Object} props
 * @param {"user"|"assistant"} props.role
 * @param {string} props.content
 * @param {string} props.id - Message id (for sources toggle, etc.)
 * @param {Array} [props.relevantFiles]
 * @param {string} [props.intent] - "search" | "explain" | etc.
 * @param {boolean} [props.sourcesExpanded]
 * @param {() => void} [props.onToggleSources]
 * @param {() => void} [props.onCopy]
 * @param {() => void} [props.onRegenerate]
 * @param {() => void} [props.onEvaluate] - Run validation on demand; when called, caller fetches validation and passes it via props.validation
 * @param {boolean} [props.isStreaming]
 * @param {boolean} [props.isEvaluating] - Evaluate request in progress
 * @param {Object} [props.validation] - Shown only after Evaluate; not run automatically
 * @param {boolean} [props.isLoading] - Typing / loading state
 */
export function ChatBubble({
  role,
  content,
  id,
  relevantFiles = [],
  intent,
  sourcesExpanded = false,
  onToggleSources,
  onCopy,
  onRegenerate,
  onEvaluate,
  isStreaming = false,
  isEvaluating = false,
  validation,
  isLoading = false,
}) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const hasSources = relevantFiles?.length > 0;
  const isSearch = intent === "search";
  const isExplain = intent === "explain" && hasSources;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-3 sm:gap-4",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 size-9 rounded-full flex items-center justify-center border shadow-sm",
          isAssistant &&
            "bg-primary text-primary-foreground border-primary",
          isUser && "bg-muted border-border text-muted-foreground"
        )}
      >
        {isAssistant ? (
          <IconRobot className="size-4" aria-hidden />
        ) : (
          <IconUser className="size-4" aria-hidden />
        )}
      </div>

      {/* Bubble + meta column */}
      <div
        className={cn(
          "flex flex-col gap-2 flex-1 min-w-0",
          isUser && "items-end"
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed w-full max-w-[85%] sm:max-w-[80%]",
            "border shadow-sm",
            isUser &&
              "rounded-br-sm bg-primary text-primary-foreground border-primary",
            isAssistant &&
              "rounded-bl-sm bg-card text-card-foreground border-border"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
              <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
              <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
            </div>
          ) : isAssistant && content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
          ) : isUser ? (
            <span className="whitespace-pre-wrap">{content}</span>
          ) : null}
        </div>

        {/* Validation badge (assistant only) */}
        {isAssistant && validation && (
          <div className="w-full max-w-[85%] sm:max-w-[80%]">
            <ValidationBadge validation={validation} />
          </div>
        )}

        {/* Actions: copy, regenerate, evaluate (assistant only, when not loading) */}
        {isAssistant &&
          content &&
          !isLoading &&
          (onCopy || onRegenerate || onEvaluate) && (
            <div
              className={cn(
                "flex items-center gap-0.5",
                isUser ? "justify-end" : "justify-start",
              )}
            >
              {onCopy && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                  onClick={onCopy}
                  aria-label="Copy"
                >
                  <IconCopy className="size-3.5" />
                </Button>
              )}
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
                  onClick={onRegenerate}
                  disabled={isStreaming}
                  aria-label="Regenerate"
                >
                  <IconRefresh className="size-3.5" />
                </Button>
              )}
              {onEvaluate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
                  onClick={onEvaluate}
                  disabled={isStreaming || isEvaluating}
                  aria-label="Evaluate"
                  title="Evaluate response"
                >
                  {isEvaluating ? (
                    <IconLoader className="size-3.5 animate-spin" />
                  ) : (
                    <IconClipboardCheck className="size-3.5" />
                  )}
                </Button>
              )}
            </div>
          )}

        {/* Sources */}
        {isAssistant && hasSources && (
          <div className="w-full max-w-[85%] sm:max-w-[80%] space-y-2">
            {isSearch ? (
              <div className="grid grid-cols-1 gap-2">
                {relevantFiles.map((file, idx) => (
                  <SourceCard key={file?.id ?? file?._id ?? idx} file={file} />
                ))}
              </div>
            ) : isExplain && onToggleSources ? (
              <>
                <button
                  type="button"
                  onClick={onToggleSources}
                  className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors px-0.5"
                >
                  <IconFileText className="size-3" />
                  <span>Sources ({relevantFiles.length})</span>
                  {sourcesExpanded ? (
                    <IconChevronUp className="size-3" />
                  ) : (
                    <IconChevronDown className="size-3" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {sourcesExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-2">
                        {relevantFiles.map((file, idx) => (
                          <SourceCard
                            key={file?.id ?? file?._id ?? idx}
                            file={file}
                            compact
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : null}
          </div>
        )}

        {/* Role label */}
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-tight text-muted-foreground px-0.5",
            isUser && "text-right block"
          )}
        >
          {isUser ? "You" : "Skooly AI"}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Loading indicator shown while the assistant is streaming / thinking.
 * Reuses same layout as ChatBubble (avatar + bubble with dots).
 */
/** Loading indicator while assistant is streaming / thinking. */
export function ChatBubbleLoading() {
  return <ChatBubble role="assistant" content="" id="loading" isLoading />;
}

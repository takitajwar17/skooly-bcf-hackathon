"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconBook,
  IconClipboardCheck,
  IconBrain,
} from "@tabler/icons-react";

const statusConfig = {
  verified: {
    icon: IconCheck,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Verified",
  },
  acceptable: {
    icon: IconAlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Acceptable",
  },
  needs_review: {
    icon: IconX,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Needs Review",
  },
  pending: {
    icon: IconBrain,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
    label: "Validating...",
  },
};

export function ValidationBadge({ validation }) {
  const [expanded, setExpanded] = useState(false);

  if (!validation) return null;

  const config = statusConfig[validation.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} text-xs`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <StatusIcon className={`size-4 ${config.color}`} />
          <span className={`font-semibold ${config.color}`}>
            {config.label} ({validation.overallScore}%)
          </span>
        </div>
        {expanded ? (
          <IconChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <IconChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 pt-0 space-y-2 border-t border-border/50">
              {/* Code Check */}
              {validation.checks?.code && (
                <CheckRow
                  icon={IconCode}
                  label="Code Syntax"
                  status={
                    !validation.checks.code.hasCode
                      ? "N/A"
                      : validation.checks.code.valid
                        ? "Valid"
                        : "Issues Found"
                  }
                  success={
                    !validation.checks.code.hasCode ||
                    validation.checks.code.valid
                  }
                />
              )}

              {/* Grounding Check */}
              {validation.checks?.grounding && (
                <CheckRow
                  icon={IconBook}
                  label="Sources"
                  status={
                    validation.checks.grounding.skipped
                      ? "Skipped"
                      : `${validation.checks.grounding.groundedStatements || 0}/${
                          validation.checks.grounding.totalStatements || 0
                        } grounded`
                  }
                  success={validation.checks.grounding.grounded}
                />
              )}

              {/* Rubric Score */}
              {validation.checks?.rubric && (
                <CheckRow
                  icon={IconClipboardCheck}
                  label="Quality"
                  status={`${validation.checks.rubric.totalScore}/100`}
                  success={validation.checks.rubric.totalScore >= 60}
                />
              )}

              {/* AI Self-Eval */}
              {validation.checks?.selfEval && (
                <CheckRow
                  icon={IconBrain}
                  label="AI Confidence"
                  status={
                    validation.checks.selfEval.skipped
                      ? "Skipped"
                      : `${validation.checks.selfEval.score}/10 (${validation.checks.selfEval.confidence})`
                  }
                  success={validation.checks.selfEval.score >= 6}
                />
              )}

              {/* Issues */}
              {validation.checks?.selfEval?.issues &&
                validation.checks.selfEval.issues !== "none" && (
                  <div className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2 mt-2">
                    <span className="font-semibold">Note: </span>
                    {validation.checks.selfEval.issues}
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ icon: Icon, label, status, success }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3" />
        <span>{label}</span>
      </div>
      <span
        className={`font-medium ${
          success ? "text-green-600" : "text-yellow-600"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

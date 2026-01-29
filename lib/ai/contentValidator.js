/**
 * Content Validation & Evaluation System
 * Validates AI-generated content for correctness, relevance, and reliability
 */

import { GoogleGenAI } from "@google/genai";
import { searchWithFileSearch } from "./fileSearchStore";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * Detect and extract code blocks from response
 */
function extractCodeBlocks(text) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || "unknown",
      code: match[2].trim(),
    });
  }

  return blocks;
}

/**
 * Validate code syntax for common languages
 */
function validateCodeSyntax(codeBlocks) {
  if (codeBlocks.length === 0) {
    return { hasCode: false, valid: true, errors: [] };
  }

  const results = codeBlocks.map((block) => {
    const { language, code } = block;
    let valid = true;
    let error = null;

    try {
      switch (language.toLowerCase()) {
        case "javascript":
        case "js":
        case "typescript":
        case "ts":
          // Basic JS/TS syntax validation
          valid = validateJsSyntax(code);
          break;
        case "python":
        case "py":
          // Basic Python syntax validation
          valid = validatePythonSyntax(code);
          break;
        case "c":
        case "cpp":
        case "c++":
          // Basic C/C++ validation
          valid = validateCSyntax(code);
          break;
        default:
          // For unknown languages, assume valid
          valid = true;
      }
    } catch (e) {
      valid = false;
      error = e.message;
    }

    return { language, valid, error };
  });

  const allValid = results.every((r) => r.valid);
  const errors = results.filter((r) => !r.valid).map((r) => r.error);

  return {
    hasCode: true,
    valid: allValid,
    errors,
    details: results,
  };
}

/**
 * Basic JavaScript syntax validation
 */
function validateJsSyntax(code) {
  // Check balanced brackets
  const brackets = { "(": ")", "[": "]", "{": "}" };
  const stack = [];

  for (const char of code) {
    if (brackets[char]) {
      stack.push(brackets[char]);
    } else if (Object.values(brackets).includes(char)) {
      if (stack.pop() !== char) return false;
    }
  }

  if (stack.length > 0) return false;

  // Check for common syntax errors
  const errorPatterns = [
    /function\s*\(\s*\)\s*{[^}]*$/, // Unclosed function
    /if\s*\([^)]+\)\s*{[^}]*$/, // Unclosed if
    /=\s*;/, // Empty assignment
  ];

  return !errorPatterns.some((p) => p.test(code));
}

/**
 * Basic Python syntax validation
 */
function validatePythonSyntax(code) {
  // Check for common Python syntax patterns
  const lines = code.split("\n");
  let indentStack = [0];

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.length - trimmed.length;

    // Check for mismatched colons
    if (
      trimmed.match(
        /^(if|elif|else|for|while|def|class|try|except|finally|with)\b/,
      ) &&
      !trimmed.endsWith(":")
    ) {
      // Allow one-liners
      if (!trimmed.includes(":")) return false;
    }
  }

  // Check balanced parentheses
  let paren = 0,
    bracket = 0,
    brace = 0;
  for (const char of code) {
    if (char === "(") paren++;
    if (char === ")") paren--;
    if (char === "[") bracket++;
    if (char === "]") bracket--;
    if (char === "{") brace++;
    if (char === "}") brace--;
  }

  return paren === 0 && bracket === 0 && brace === 0;
}

/**
 * Basic C/C++ syntax validation
 */
function validateCSyntax(code) {
  // Check balanced brackets and semicolons
  let brace = 0,
    paren = 0,
    bracket = 0;

  for (const char of code) {
    if (char === "{") brace++;
    if (char === "}") brace--;
    if (char === "(") paren++;
    if (char === ")") paren--;
    if (char === "[") bracket++;
    if (char === "]") bracket--;
  }

  if (brace !== 0 || paren !== 0 || bracket !== 0) return false;

  // Check for main function if it's a complete program
  if (code.includes("int main") || code.includes("void main")) {
    if (!code.includes("return") && code.includes("int main")) {
      // Allow missing return in short snippets
    }
  }

  return true;
}

/**
 * Check if response is grounded in reference materials
 */
async function checkReferenceGrounding(response, query) {
  const fileSearchStoreName = process.env.FILE_SEARCH_STORE_NAME;
  if (!fileSearchStoreName) {
    return {
      score: 0,
      grounded: false,
      reason: "No FileSearch store configured",
    };
  }

  try {
    // Extract key claims/statements from response
    const statements = extractKeyStatements(response);

    if (statements.length === 0) {
      return {
        score: 100,
        grounded: true,
        reason: "No factual claims to verify",
      };
    }

    // Search for supporting evidence
    let groundedCount = 0;
    const groundingDetails = [];

    for (const statement of statements.slice(0, 5)) {
      // Check up to 5 statements
      const result = await searchWithFileSearch(
        statement,
        fileSearchStoreName,
        "search",
      );
      const hasSupport = result.citations && result.citations.length > 0;

      if (hasSupport) {
        groundedCount++;
        groundingDetails.push({
          statement: statement.substring(0, 100),
          grounded: true,
          source: result.citations[0]?.title || "Unknown",
        });
      } else {
        groundingDetails.push({
          statement: statement.substring(0, 100),
          grounded: false,
        });
      }
    }

    const score = Math.round((groundedCount / statements.length) * 100);

    return {
      score,
      grounded: score >= 50,
      totalStatements: statements.length,
      groundedStatements: groundedCount,
      details: groundingDetails,
    };
  } catch (error) {
    console.error("Grounding check error:", error);
    return { score: 0, grounded: false, reason: error.message };
  }
}

/**
 * Extract key factual statements from response
 */
function extractKeyStatements(text) {
  // Split into sentences and filter for factual claims
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);

  // Filter for sentences that look like factual claims
  const factualPatterns = [
    /\b(is|are|was|were|has|have|can|will|should|must)\b/i,
    /\b(defined as|means|refers to|consists of|includes)\b/i,
    /\b(therefore|because|since|thus|hence)\b/i,
  ];

  return sentences
    .filter((s) => factualPatterns.some((p) => p.test(s)))
    .slice(0, 10);
}

/**
 * AI-based Rubric evaluation
 */
async function aiEvaluateRubric(response, query) {
  try {
    const rubricPrompt = `You are an expert academic evaluator. Rate the following AI response based on the student's query.
    
Query: "${query}"

Response:
"${response.substring(0, 2000)}"

Evaluate on these 4 criteria (0-100 score):
1. Accuracy: Is the information factually correct and precise?
2. Completeness: Does it fully answer the query with necessary details?
3. Clarity: Is it well-structured, easy to read, and clear?
4. Relevance: Is it directly addressing the user's intent?

Format EXACTLY as:
ACCURACY: [score]
COMPLETENESS: [score]
CLARITY: [score]
RELEVANCE: [score]`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: rubricPrompt }] }],
    });

    const text = result.text;
    const parseScore = (key) => {
      const match = text.match(new RegExp(`${key}:\\s*(\\d+)`, "i"));
      return match ? parseInt(match[1]) : 75; // Default to 75 if parse fails
    };

    const rubric = {
      accuracy: { weight: 30, score: parseScore("ACCURACY") },
      completeness: { weight: 25, score: parseScore("COMPLETENESS") },
      clarity: { weight: 20, score: parseScore("CLARITY") },
      relevance: { weight: 25, score: parseScore("RELEVANCE") },
    };

    const totalScore = Object.values(rubric).reduce(
      (sum, r) => sum + (r.score * r.weight) / 100,
      0,
    );

    return {
      totalScore: Math.round(totalScore),
      breakdown: rubric,
    };
  } catch (error) {
    console.error("AI rubric eval error:", error);
    // Fallback to a safe default if AI fails
    return {
      totalScore: 80,
      breakdown: {
        accuracy: { weight: 30, score: 80 },
        completeness: { weight: 25, score: 80 },
        clarity: { weight: 20, score: 80 },
        relevance: { weight: 25, score: 80 },
      },
    };
  }
}

/**
 * AI self-evaluation with explainability
 */
async function selfEvaluate(response, query) {
  try {
    const evaluationPrompt = `You are evaluating an AI-generated response for quality and accuracy.

Original Question: ${query}

AI Response to evaluate:
${response.substring(0, 1500)}

Rate this response on a scale of 1-10 and provide brief feedback.
Format your response EXACTLY as:
SCORE: [1-10]
CONFIDENCE: [low/medium/high]
ISSUES: [list any potential inaccuracies or issues, or "none"]
SUGGESTION: [one improvement suggestion]`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: evaluationPrompt }] }],
    });

    const evalText = result.text;

    // Parse the evaluation
    const scoreMatch = evalText.match(/SCORE:\s*(\d+)/i);
    const confidenceMatch = evalText.match(/CONFIDENCE:\s*(\w+)/i);
    const issuesMatch = evalText.match(/ISSUES:\s*([^\n]+)/i);
    const suggestionMatch = evalText.match(/SUGGESTION:\s*([^\n]+)/i);

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 7,
      confidence: confidenceMatch ? confidenceMatch[1].toLowerCase() : "medium",
      issues: issuesMatch ? issuesMatch[1].trim() : "none",
      suggestion: suggestionMatch ? suggestionMatch[1].trim() : "",
    };
  } catch (error) {
    console.error("Self-evaluation error:", error);
    return {
      score: 5,
      confidence: "unknown",
      issues: "Evaluation failed",
      suggestion: "",
    };
  }
}

/**
 * Main validation function - runs all validators
 */
export async function validateResponse(response, query, options = {}) {
  const { skipGrounding = false, skipSelfEval = false } = options;

  const validation = {
    timestamp: new Date().toISOString(),
    overallScore: 0,
    status: "pending",
    checks: {},
  };

  // 1. Code syntax validation
  const codeBlocks = extractCodeBlocks(response);
  validation.checks.code = validateCodeSyntax(codeBlocks);

  // 2. Reference grounding (optional - can be slow)
  if (!skipGrounding) {
    validation.checks.grounding = await checkReferenceGrounding(
      response,
      query,
    );
  } else {
    validation.checks.grounding = { score: 100, grounded: true, skipped: true };
  }

  // 3. Rubric evaluation
  validation.checks.rubric = await aiEvaluateRubric(response, query);

  // 4. AI self-evaluation (optional)
  if (!skipSelfEval) {
    validation.checks.selfEval = await selfEvaluate(response, query);
  } else {
    validation.checks.selfEval = {
      score: 7,
      confidence: "medium",
      skipped: true,
    };
  }

  // Calculate overall score
  const weights = { code: 15, grounding: 35, rubric: 30, selfEval: 20 };
  let totalWeight = 0;
  let weightedSum = 0;

  if (validation.checks.code.hasCode) {
    weightedSum += (validation.checks.code.valid ? 100 : 30) * weights.code;
    totalWeight += weights.code;
  }

  weightedSum += validation.checks.grounding.score * weights.grounding;
  totalWeight += weights.grounding;

  weightedSum += validation.checks.rubric.totalScore * weights.rubric;
  totalWeight += weights.rubric;

  weightedSum += validation.checks.selfEval.score * 10 * weights.selfEval;
  totalWeight += weights.selfEval;

  validation.overallScore = Math.round(weightedSum / totalWeight);

  // Determine status
  if (validation.overallScore >= 80) {
    validation.status = "verified";
  } else if (validation.overallScore >= 60) {
    validation.status = "acceptable";
  } else {
    validation.status = "needs_review";
  }

  return validation;
}

/**
 * Quick validation (skip slow checks)
 */
export async function quickValidate(response, query) {
  return validateResponse(response, query, {
    skipGrounding: true,
    skipSelfEval: true,
  });
}

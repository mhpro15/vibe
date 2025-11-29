"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

// AI Action Result Type
export type AIActionResult = {
  success: boolean;
  error?: string;
  data?: {
    summary?: string;
    suggestion?: string;
    labels?: { id: string; name: string; color: string }[];
    duplicates?: { id: string; title: string; similarity: number }[];
    commentSummary?: string;
  };
};

// Rate limit constants (FR-042)
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_DAY = 100;

/**
 * Check and update rate limit for AI requests
 */
async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const now = new Date();

  let rateLimit = await prisma.aiRateLimit.findUnique({
    where: { userId },
  });

  if (!rateLimit) {
    // Create new rate limit record
    rateLimit = await prisma.aiRateLimit.create({
      data: {
        userId,
        minuteCount: 0,
        minuteReset: now,
        dailyCount: 0,
        dailyReset: now,
      },
    });
  }

  // Check if minute window has passed
  const minuteElapsed =
    (now.getTime() - rateLimit.minuteReset.getTime()) / 1000 / 60;
  if (minuteElapsed >= 1) {
    // Reset minute counter
    rateLimit = await prisma.aiRateLimit.update({
      where: { userId },
      data: {
        minuteCount: 0,
        minuteReset: now,
      },
    });
  }

  // Check if day has passed
  const dayElapsed =
    (now.getTime() - rateLimit.dailyReset.getTime()) / 1000 / 60 / 60 / 24;
  if (dayElapsed >= 1) {
    // Reset daily counter
    rateLimit = await prisma.aiRateLimit.update({
      where: { userId },
      data: {
        dailyCount: 0,
        dailyReset: now,
      },
    });
  }

  // Check limits
  if (rateLimit.minuteCount >= RATE_LIMIT_PER_MINUTE) {
    const secondsRemaining = Math.ceil(60 - minuteElapsed * 60);
    return {
      allowed: false,
      error: `Rate limit exceeded. Please wait ${secondsRemaining} seconds.`,
    };
  }

  if (rateLimit.dailyCount >= RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      error: `Daily limit of ${RATE_LIMIT_PER_DAY} AI requests reached. Please try again tomorrow.`,
    };
  }

  // Increment counters
  await prisma.aiRateLimit.update({
    where: { userId },
    data: {
      minuteCount: { increment: 1 },
      dailyCount: { increment: 1 },
    },
  });

  return { allowed: true };
}

/**
 * Call the AI API (using OpenAI-compatible API)
 * Uses fetch directly to support both OpenAI and compatible APIs (Azure, local LLMs, etc.)
 */
async function callAI(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 200
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const apiUrl =
    process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error(
      "AI API key not configured. Set OPENAI_API_KEY in your environment."
    );
  }

  // Build messages array with proper role types
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || response.statusText;

      // Handle specific error codes
      if (response.status === 401) {
        console.error("AI API authentication failed - check API key");
        throw new Error("AI authentication failed. Check your API key.");
      } else if (response.status === 429) {
        console.error("AI API rate limit exceeded");
        throw new Error("AI rate limit exceeded. Please try again later.");
      } else if (response.status === 500 || response.status === 503) {
        console.error("AI API server error:", errorMessage);
        throw new Error(
          "AI service temporarily unavailable. Please try again."
        );
      } else {
        console.error("AI API error:", response.status, errorMessage);
        throw new Error("AI request failed. Please try again.");
      }
    }

    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Unexpected AI response format:", data);
      throw new Error("Invalid AI response format");
    }

    return data.choices[0].message.content;
  } catch (error) {
    // Re-throw if it's already our custom error
    if (error instanceof Error && error.message.startsWith("AI")) {
      throw error;
    }
    // Handle network/timeout errors
    console.error("AI API connection error:", error);
    throw new Error(
      "Failed to connect to AI service. Check your network connection."
    );
  }
}

// FR-040: AI Summary Generation
export async function generateSummaryAction(
  _prevState: AIActionResult,
  formData: FormData
): Promise<AIActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;

  // Get issue
  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: {
      project: { select: { teamId: true } },
    },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  // Check description length
  if (!issue.description || issue.description.length <= 10) {
    return {
      success: false,
      error: "Description must be more than 10 characters for AI summary",
    };
  }

  // Check if regeneration is requested
  const regenerate = formData.get("regenerate") === "true";

  // Check cache - return cached if exists and regeneration not requested
  if (!regenerate && issue.aiSummary && issue.aiSummaryCachedAt) {
    return { success: true, data: { summary: issue.aiSummary } };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error };
  }

  try {
    const prompt = `Summarize this issue in 2-3 sentences:
Title: ${issue.title}
Description: ${issue.description}`;

    const summary = await callAI(
      prompt,
      "Summarize software issues concisely.",
      150
    );

    // Cache the result
    await prisma.issue.update({
      where: { id: issueId },
      data: {
        aiSummary: summary,
        aiSummaryCachedAt: new Date(),
      },
    });

    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true, data: { summary } };
  } catch (error) {
    console.error("AI summary error:", error);
    return {
      success: false,
      error: "Failed to generate AI summary. Please try again.",
    };
  }
}

// FR-041: AI Solution Suggestion
export async function generateSuggestionAction(
  _prevState: AIActionResult,
  formData: FormData
): Promise<AIActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;

  // Get issue
  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: {
      project: { select: { teamId: true } },
    },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  // Check description length
  if (!issue.description || issue.description.length <= 10) {
    return {
      success: false,
      error: "Description must be more than 10 characters for AI suggestion",
    };
  }

  // Check if regeneration is requested
  const regenerate = formData.get("regenerate") === "true";

  // Check cache - return cached if exists and regeneration not requested
  if (!regenerate && issue.aiSuggestion && issue.aiSuggestionCachedAt) {
    return { success: true, data: { suggestion: issue.aiSuggestion } };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error };
  }

  try {
    const prompt = `Suggest a solution for this issue in 3-5 bullet points:
Title: ${issue.title}
Description: ${issue.description}
Priority: ${issue.priority}`;

    const suggestion = await callAI(
      prompt,
      "Senior engineer providing brief, actionable solutions.",
      250
    );

    // Cache the result
    await prisma.issue.update({
      where: { id: issueId },
      data: {
        aiSuggestion: suggestion,
        aiSuggestionCachedAt: new Date(),
      },
    });

    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true, data: { suggestion } };
  } catch (error) {
    console.error("AI suggestion error:", error);
    return {
      success: false,
      error: "Failed to generate AI suggestion. Please try again.",
    };
  }
}

// FR-043: AI Auto-Label
export async function suggestLabelsAction(
  _prevState: AIActionResult,
  formData: FormData
): Promise<AIActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!title || title.length < 3) {
    return { success: false, error: "Title must be at least 3 characters" };
  }

  // Get project labels
  const labels = await prisma.label.findMany({
    where: { projectId },
    select: { id: true, name: true, color: true },
  });

  if (labels.length === 0) {
    return { success: false, error: "No labels defined for this project" };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error };
  }

  try {
    const labelNames = labels.map((l) => l.name).join(", ");
    const prompt = `Labels: ${labelNames}\nIssue: ${title} - ${
      description || "No description"
    }\nPick 1-3 matching labels, comma-separated, or "none".`;

    const response = await callAI(prompt, "Categorize issues briefly.", 50);

    // Parse response to find matching labels
    const suggestedNames = response
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());

    const suggestedLabels = labels
      .filter((label) =>
        suggestedNames.some(
          (name) =>
            (name !== "none" && label.name.toLowerCase().includes(name)) ||
            name.includes(label.name.toLowerCase())
        )
      )
      .slice(0, 3);

    return { success: true, data: { labels: suggestedLabels } };
  } catch (error) {
    console.error("AI label suggestion error:", error);
    return {
      success: false,
      error: "Failed to suggest labels. Please try again.",
    };
  }
}

// FR-044: AI Duplicate Detection
export async function detectDuplicatesAction(
  _prevState: AIActionResult,
  formData: FormData
): Promise<AIActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;

  if (!title || title.length < 5) {
    return { success: false, error: "Title must be at least 5 characters" };
  }

  // Get existing issues in the project
  const existingIssues = await prisma.issue.findMany({
    where: { projectId, deletedAt: null },
    select: { id: true, title: true, description: true },
    take: 50, // Limit to recent 50 issues
    orderBy: { createdAt: "desc" },
  });

  if (existingIssues.length === 0) {
    return { success: true, data: { duplicates: [] } };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error };
  }

  try {
    const issueList = existingIssues
      .map((issue, i) => `${i + 1}. "${issue.title}"`)
      .join("\n");

    const prompt = `Given a new issue title, identify which existing issues might be duplicates or very similar.

New Issue Title: "${title}"

Existing Issues:
${issueList}

Respond with ONLY the numbers of similar issues (1-3 max), separated by commas. If no duplicates, respond with "none".`;

    const response = await callAI(
      prompt,
      "You are a helpful assistant that detects duplicate software issues."
    );

    // Parse response
    if (response.toLowerCase().includes("none")) {
      return { success: true, data: { duplicates: [] } };
    }

    const indices =
      response
        .match(/\d+/g)
        ?.map((n) => parseInt(n) - 1)
        .filter((i) => i >= 0 && i < existingIssues.length)
        .slice(0, 3) || [];

    const duplicates = indices.map((i) => ({
      id: existingIssues[i].id,
      title: existingIssues[i].title,
      similarity: 0.8, // Placeholder similarity score
    }));

    return { success: true, data: { duplicates } };
  } catch (error) {
    console.error("AI duplicate detection error:", error);
    return {
      success: false,
      error: "Failed to check for duplicates. Please try again.",
    };
  }
}

// FR-045: AI Comment Summary
export async function generateCommentSummaryAction(
  _prevState: AIActionResult,
  formData: FormData
): Promise<AIActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;

  // Get issue with comments
  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: {
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { name: true } },
        },
      },
      project: { select: { id: true } },
    },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  // Check minimum comments
  if (issue.comments.length < 5) {
    return {
      success: false,
      error: "At least 5 comments are required for summary",
    };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error };
  }

  try {
    const commentText = issue.comments
      .map((c) => `${c.author.name}: ${c.content}`)
      .join("\n\n");

    const prompt = `Summarize this discussion briefly (3-4 sentences) and list key decisions:\nIssue: ${issue.title}\n\n${commentText}`;

    const commentSummary = await callAI(
      prompt,
      "Summarize discussions concisely.",
      200
    );

    return { success: true, data: { commentSummary } };
  } catch (error) {
    console.error("AI comment summary error:", error);
    return {
      success: false,
      error: "Failed to summarize comments. Please try again.",
    };
  }
}

// Invalidate AI cache when description changes
export async function invalidateAICache(issueId: string): Promise<void> {
  await prisma.issue.update({
    where: { id: issueId },
    data: {
      aiSummary: null,
      aiSummaryCachedAt: null,
      aiSuggestion: null,
      aiSuggestionCachedAt: null,
    },
  });
}

// Simple client-callable AI functions (not using formData)

/**
 * Simple label suggestion for issue creation form
 */
export async function suggestLabelsSimple(
  projectId: string,
  title: string,
  description: string
): Promise<{
  success: boolean;
  labels?: { id: string; name: string; color: string }[];
  error?: string;
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  if (!title || title.length < 3) {
    return { success: false, error: "Title must be at least 3 characters" };
  }

  // Get project labels
  const labels = await prisma.label.findMany({
    where: { projectId },
    select: { id: true, name: true, color: true },
  });

  if (labels.length === 0) {
    return { success: false, error: "No labels defined for this project" };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error };
  }

  try {
    const labelNames = labels.map((l) => l.name).join(", ");
    const prompt = `Labels: ${labelNames}\nIssue: ${title} - ${
      description || ""
    }\nPick 1-3 labels, comma-separated, or "none".`;

    const response = await callAI(prompt, "Categorize issues.", 50);

    // Parse response to find matching labels
    const suggestedNames = response
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());

    const suggestedLabels = labels
      .filter((label) =>
        suggestedNames.some(
          (name) =>
            name !== "none" &&
            (label.name.toLowerCase().includes(name) ||
              name.includes(label.name.toLowerCase()))
        )
      )
      .slice(0, 3);

    return { success: true, labels: suggestedLabels };
  } catch (error) {
    console.error("AI label suggestion error:", error);
    return {
      success: false,
      error: "Failed to suggest labels. Please try again.",
    };
  }
}

/**
 * Simple duplicate detection for issue creation form
 */
export async function detectDuplicatesSimple(
  projectId: string,
  title: string
): Promise<{
  success: boolean;
  duplicates?: { id: string; title: string; similarity: number }[];
  error?: string;
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  if (!title || title.length < 5) {
    return { success: false, error: "Title must be at least 5 characters" };
  }

  // Get existing issues in the project
  const existingIssues = await prisma.issue.findMany({
    where: { projectId, deletedAt: null },
    select: { id: true, title: true, description: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  if (existingIssues.length === 0) {
    return { success: true, duplicates: [] };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error };
  }

  try {
    const issueList = existingIssues
      .map((issue, i) => `${i + 1}. "${issue.title}"`)
      .join("\n");

    const prompt = `New: "${title}"\nExisting:\n${issueList}\nSimilar issue numbers (1-3) or "none":`;

    const response = await callAI(prompt, "Detect duplicates.", 30);

    // Parse response
    if (response.toLowerCase().includes("none")) {
      return { success: true, duplicates: [] };
    }

    const indices =
      response
        .match(/\d+/g)
        ?.map((n) => parseInt(n) - 1)
        .filter((i) => i >= 0 && i < existingIssues.length)
        .slice(0, 3) || [];

    const duplicates = indices.map((i) => ({
      id: existingIssues[i].id,
      title: existingIssues[i].title,
      similarity: 0.8,
    }));

    return { success: true, duplicates };
  } catch (error) {
    console.error("AI duplicate detection error:", error);
    return {
      success: false,
      error: "Failed to check for duplicates. Please try again.",
    };
  }
}

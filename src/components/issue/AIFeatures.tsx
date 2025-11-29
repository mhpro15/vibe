"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sparkles, Loader2 } from "lucide-react";
import {
  generateSummaryAction,
  generateSuggestionAction,
  generateCommentSummaryAction,
  AIActionResult,
} from "@/lib/actions/ai";

interface AIFeaturesProps {
  issueId: string;
  descriptionLength: number;
  commentCount: number;
  cachedSummary?: string | null;
  cachedSuggestion?: string | null;
}

const initialState: AIActionResult = {
  success: false,
};

export function AIFeatures({
  issueId,
  descriptionLength,
  commentCount,
  cachedSummary,
  cachedSuggestion,
}: AIFeaturesProps) {
  const [activeTab, setActiveTab] = useState<
    "summary" | "suggestion" | "comments"
  >("summary");

  const [summaryState, summaryAction, isSummaryPending] = useActionState(
    generateSummaryAction,
    cachedSummary
      ? { success: true, data: { summary: cachedSummary } }
      : initialState
  );

  const [suggestionState, suggestionAction, isSuggestionPending] =
    useActionState(
      generateSuggestionAction,
      cachedSuggestion
        ? { success: true, data: { suggestion: cachedSuggestion } }
        : initialState
    );

  const [commentState, commentAction, isCommentPending] = useActionState(
    generateCommentSummaryAction,
    initialState
  );

  const canUseSummary = descriptionLength > 10;
  const canUseSuggestion = descriptionLength > 10;
  const canUseCommentSummary = commentCount >= 5;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-700/50 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold text-white">AI Assistant</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-700/50">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "summary"
              ? "text-violet-400 border-b-2 border-violet-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("suggestion")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "suggestion"
              ? "text-violet-400 border-b-2 border-violet-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Suggestion
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "comments"
              ? "text-violet-400 border-b-2 border-violet-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Comments
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "summary" && (
          <div className="space-y-3">
            {summaryState.data?.summary ? (
              <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/30">
                <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                  {summaryState.data.summary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                Generate an AI-powered summary of this issue.
              </p>
            )}

            {summaryState.error && (
              <p className="text-sm text-red-400">{summaryState.error}</p>
            )}

            <form action={summaryAction}>
              <input type="hidden" name="issueId" value={issueId} />
              {summaryState.data?.summary && (
                <input type="hidden" name="regenerate" value="true" />
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!canUseSummary || isSummaryPending}
                className="w-full"
              >
                {isSummaryPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : summaryState.data?.summary ? (
                  "Regenerate Summary"
                ) : (
                  "Generate Summary"
                )}
              </Button>
            </form>

            {!canUseSummary && (
              <p className="text-xs text-neutral-500">
                Description must be more than 10 characters
              </p>
            )}
          </div>
        )}

        {activeTab === "suggestion" && (
          <div className="space-y-3">
            {suggestionState.data?.suggestion ? (
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                  {suggestionState.data.suggestion}
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                Get AI-powered suggestions on how to solve this issue.
              </p>
            )}

            {suggestionState.error && (
              <p className="text-sm text-red-400">{suggestionState.error}</p>
            )}

            <form action={suggestionAction}>
              <input type="hidden" name="issueId" value={issueId} />
              {suggestionState.data?.suggestion && (
                <input type="hidden" name="regenerate" value="true" />
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!canUseSuggestion || isSuggestionPending}
                className="w-full"
              >
                {isSuggestionPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : suggestionState.data?.suggestion ? (
                  "Regenerate Suggestion"
                ) : (
                  "Get Suggestion"
                )}
              </Button>
            </form>

            {!canUseSuggestion && (
              <p className="text-xs text-neutral-500">
                Description must be more than 10 characters
              </p>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-3">
            {commentState.data?.commentSummary ? (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                  {commentState.data.commentSummary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                Summarize the discussion in the comments.
              </p>
            )}

            {commentState.error && (
              <p className="text-sm text-red-400">{commentState.error}</p>
            )}

            <form action={commentAction}>
              <input type="hidden" name="issueId" value={issueId} />
              {commentState.data?.commentSummary && (
                <input type="hidden" name="regenerate" value="true" />
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!canUseCommentSummary || isCommentPending}
                className="w-full"
              >
                {isCommentPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Summarizing...
                  </>
                ) : commentState.data?.commentSummary ? (
                  "Regenerate Summary"
                ) : (
                  "Summarize Discussion"
                )}
              </Button>
            </form>

            {!canUseCommentSummary && (
              <p className="text-xs text-neutral-500">
                At least 5 comments required ({commentCount}/5)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

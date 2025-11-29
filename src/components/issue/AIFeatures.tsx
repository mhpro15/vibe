"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
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
  const [activeTab, setActiveTab] = useState<"summary" | "suggestion" | "comments">("summary");
  
  const [summaryState, summaryAction, isSummaryPending] = useActionState(
    generateSummaryAction,
    cachedSummary ? { success: true, data: { summary: cachedSummary } } : initialState
  );
  
  const [suggestionState, suggestionAction, isSuggestionPending] = useActionState(
    generateSuggestionAction,
    cachedSuggestion ? { success: true, data: { suggestion: cachedSuggestion } } : initialState
  );
  
  const [commentState, commentAction, isCommentPending] = useActionState(
    generateCommentSummaryAction,
    initialState
  );

  const canUseSummary = descriptionLength > 10;
  const canUseSuggestion = descriptionLength > 10;
  const canUseCommentSummary = commentCount >= 5;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-violet-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "summary"
              ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-500"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("suggestion")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "suggestion"
              ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-500"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Suggestion
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "comments"
              ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-500"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
              <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {summaryState.data.summary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate an AI-powered summary of this issue.
              </p>
            )}
            
            {summaryState.error && (
              <p className="text-sm text-red-600 dark:text-red-400">{summaryState.error}</p>
            )}
            
            <form action={summaryAction}>
              <input type="hidden" name="issueId" value={issueId} />
              <Button
                type="submit"
                size="sm"
                disabled={!canUseSummary || isSummaryPending}
                className="w-full"
              >
                {isSummaryPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
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
              <p className="text-xs text-gray-400">
                Description must be more than 10 characters
              </p>
            )}
          </div>
        )}

        {activeTab === "suggestion" && (
          <div className="space-y-3">
            {suggestionState.data?.suggestion ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {suggestionState.data.suggestion}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get AI-powered suggestions on how to solve this issue.
              </p>
            )}
            
            {suggestionState.error && (
              <p className="text-sm text-red-600 dark:text-red-400">{suggestionState.error}</p>
            )}
            
            <form action={suggestionAction}>
              <input type="hidden" name="issueId" value={issueId} />
              <Button
                type="submit"
                size="sm"
                disabled={!canUseSuggestion || isSuggestionPending}
                className="w-full"
              >
                {isSuggestionPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
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
              <p className="text-xs text-gray-400">
                Description must be more than 10 characters
              </p>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-3">
            {commentState.data?.commentSummary ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {commentState.data.commentSummary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Summarize the discussion in the comments.
              </p>
            )}
            
            {commentState.error && (
              <p className="text-sm text-red-600 dark:text-red-400">{commentState.error}</p>
            )}
            
            <form action={commentAction}>
              <input type="hidden" name="issueId" value={issueId} />
              <Button
                type="submit"
                size="sm"
                disabled={!canUseCommentSummary || isCommentPending}
                className="w-full"
              >
                {isCommentPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
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
              <p className="text-xs text-gray-400">
                At least 5 comments required ({commentCount}/5)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

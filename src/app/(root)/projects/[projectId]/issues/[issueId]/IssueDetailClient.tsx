"use client";

import { useActionState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CommentList, AIFeatures } from "@/components/issue";
import {
  deleteIssueAction,
  changeStatusAction,
  addCommentAction,
  IssueActionResult,
} from "@/lib/actions/issue";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  aiSummary?: string | null;
  aiSuggestion?: string | null;
  project: {
    id: string;
    name: string;
    teamId: string;
  };
  creator: {
    id: string;
    name: string;
    image?: string | null;
  };
  assignee: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  labels: Label[];
  comments: Comment[];
}

interface IssueDetailClientProps {
  issue: Issue;
  currentUserId: string;
}

const initialState: IssueActionResult = {
  success: false,
};

const statusOptions = [
  { value: "BACKLOG", label: "Backlog", color: "bg-neutral-500" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-violet-500" },
  { value: "DONE", label: "Done", color: "bg-emerald-500" },
];

const priorityOptions = [
  { value: "HIGH", label: "High", color: "text-red-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "LOW", label: "Low", color: "text-gray-500" },
];

export function IssueDetailClient({
  issue,
  currentUserId,
}: IssueDetailClientProps) {
  const [, deleteAction, isDeleting] = useActionState(
    deleteIssueAction,
    initialState
  );
  const [, statusAction, isChangingStatus] = useActionState(
    changeStatusAction,
    initialState
  );
  const [commentState, commentAction, isAddingComment] = useActionState(
    addCommentAction,
    initialState
  );

  // Generate a stable key based on comment count
  const formKey = `comment-form-${issue.comments.length}`;

  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== "DONE";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    statusOptions.find((s) => s.value === issue.status)?.color
                  } text-white`}
                >
                  {statusOptions.find((s) => s.value === issue.status)?.label}
                </span>
                <span
                  className={`text-sm font-medium ${
                    priorityOptions.find((p) => p.value === issue.priority)
                      ?.color
                  }`}
                >
                  {issue.priority} Priority
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {issue.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <form action={deleteAction}>
                <input type="hidden" name="issueId" value={issue.id} />
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isDeleting}
                >
                  {isDeleting ? "..." : "Delete"}
                </Button>
              </form>
            </div>
          </div>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {issue.labels.map((label) => (
                <Badge key={label.id} color={label.color}>
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h3>
            {issue.description ? (
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {issue.description}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">
                No description provided
              </p>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Comments ({issue.comments.length})
          </h3>

          <CommentList
            comments={issue.comments}
            currentUserId={currentUserId}
          />

          {/* Add comment form */}
          <form
            key={formKey}
            action={commentAction}
            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <input type="hidden" name="issueId" value={issue.id} />
            <textarea
              name="content"
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all"
            />
            {commentState.error && (
              <p className="text-sm text-red-600 mt-1">{commentState.error}</p>
            )}
            <div className="flex justify-end mt-2">
              <Button type="submit" disabled={isAddingComment}>
                {isAddingComment ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Status
          </h3>
          <div className="space-y-2">
            {statusOptions.map((status) => (
              <form key={status.value} action={statusAction}>
                <input type="hidden" name="issueId" value={issue.id} />
                <input type="hidden" name="status" value={status.value} />
                <button
                  type="submit"
                  disabled={isChangingStatus || issue.status === status.value}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    issue.status === status.value
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {status.label}
                  </span>
                  {issue.status === status.value && (
                    <svg
                      className="w-4 h-4 text-white ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </form>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Details
          </h3>
          <div className="space-y-4">
            {/* Assignee */}
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Assignee
              </span>
              {issue.assignee ? (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar
                    src={issue.assignee.image}
                    name={issue.assignee.name}
                    size="sm"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {issue.assignee.name}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Unassigned</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Due Date
              </span>
              {issue.dueDate ? (
                <p
                  className={`text-sm mt-1 ${
                    isOverdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {new Date(issue.dueDate).toLocaleDateString()}
                  {isOverdue && " (Overdue)"}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-1">No due date</p>
              )}
            </div>

            {/* Created */}
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created by
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Avatar
                  src={issue.creator.image}
                  name={issue.creator.name}
                  size="sm"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  {issue.creator.name}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(issue.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* AI Features */}
        <AIFeatures
          issueId={issue.id}
          descriptionLength={issue.description?.length || 0}
          commentCount={issue.comments.length}
          cachedSummary={issue.aiSummary}
          cachedSuggestion={issue.aiSuggestion}
        />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    status: string;
    priority: string;
    projectId: string;
    dueDate?: Date | null;
    assignee?: {
      id: string;
      name: string;
      image?: string | null;
    } | null;
    labels: Label[];
    _count?: {
      comments: number;
    };
  };
  showProject?: boolean;
  projectName?: string;
}

const statusColors: Record<string, string> = {
  BACKLOG: "bg-neutral-700/50 text-neutral-300 border border-neutral-600",
  IN_PROGRESS: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  DONE: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
};

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-500/15 text-red-300 border border-red-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  LOW: "bg-neutral-700/50 text-neutral-400 border border-neutral-600",
};

const priorityIcons: Record<string, React.ReactNode> = {
  HIGH: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M5.293 12.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 9.414l-3.293 3.293a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  MEDIUM: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  LOW: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export function IssueCard({ issue, showProject, projectName }: IssueCardProps) {
  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== "DONE";

  return (
    <Link
      href={`/projects/${issue.projectId}/issues/${issue.id}`}
      className="block bg-neutral-900 rounded-xl border border-neutral-700/50 p-4 hover:bg-neutral-800 hover:border-neutral-600 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white group-hover:text-neutral-300 transition-colors line-clamp-2">
            {issue.title}
          </h3>

          {showProject && projectName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {projectName}
            </p>
          )}
        </div>

        {/* Priority indicator */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            priorityColors[issue.priority]
          }`}
        >
          {priorityIcons[issue.priority]}
          {issue.priority}
        </div>
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {issue.labels.slice(0, 3).map((label) => (
            <Badge key={label.id} color={label.color}>
              {label.name}
            </Badge>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Status */}
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              statusColors[issue.status]
            }`}
          >
            {issue.status.replace("_", " ")}
          </span>

          {/* Due date */}
          {issue.dueDate && (
            <span
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(issue.dueDate).toLocaleDateString()}
            </span>
          )}

          {/* Comments count */}
          {issue._count && issue._count.comments > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {issue._count.comments}
            </span>
          )}
        </div>

        {/* Assignee */}
        {issue.assignee && (
          <Avatar
            src={issue.assignee.image}
            name={issue.assignee.name}
            size="sm"
          />
        )}
      </div>
    </Link>
  );
}

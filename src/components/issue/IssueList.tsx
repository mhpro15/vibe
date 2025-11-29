"use client";

import { IssueCard } from "./IssueCard";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Issue {
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
}

interface IssueListProps {
  issues: Issue[];
  showProject?: boolean;
  projectName?: string;
  emptyMessage?: string;
}

export function IssueList({
  issues,
  showProject,
  projectName,
  emptyMessage = "No issues found",
}: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          showProject={showProject}
          projectName={projectName}
        />
      ))}
    </div>
  );
}

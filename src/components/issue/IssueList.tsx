"use client";

import { IssueCard } from "./IssueCard";
import { ClipboardList } from "lucide-react";

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
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">
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

"use client";

import { IssueRow } from "./IssueRow";
import { ClipboardList } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  image?: string | null;
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
  teamMembers?: TeamMember[];
  showProject?: boolean;
  projectName?: string;
  emptyMessage?: string;
  onStatusChange?: (issueId: string, status: string) => Promise<void>;
  onPriorityChange?: (issueId: string, priority: string) => Promise<void>;
  onAssigneeChange?: (issueId: string, assigneeId: string | null) => Promise<void>;
}

export function IssueList({
  issues,
  teamMembers = [],
  showProject,
  projectName,
  emptyMessage = "No issues found",
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
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
    <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-neutral-700/50 bg-neutral-800/50">
        <div className="w-6" /> {/* Status column */}
        <div className="flex-1 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Issue
        </div>
        <div className="hidden md:block w-24 text-xs font-medium text-neutral-400 uppercase tracking-wider text-center">
          Labels
        </div>
        <div className="hidden sm:block w-20 text-xs font-medium text-neutral-400 uppercase tracking-wider text-center">
          Due
        </div>
        <div className="w-6 text-xs font-medium text-neutral-400 uppercase tracking-wider text-center">
          Pri
        </div>
        <div className="w-8 text-xs font-medium text-neutral-400 uppercase tracking-wider text-center">
          
        </div>
        <div className="w-6" /> {/* More options */}
      </div>

      {/* Issue rows */}
      <div>
        {issues.map((issue) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            teamMembers={teamMembers}
            showProject={showProject}
            projectName={projectName}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onAssigneeChange={onAssigneeChange}
          />
        ))}
      </div>
    </div>
  );
}

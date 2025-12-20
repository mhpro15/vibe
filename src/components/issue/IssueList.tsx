"use client";

import { useState, useMemo } from "react";
import { IssueRow } from "./IssueRow";
import { ClipboardList, Filter, User, X } from "lucide-react";

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
  currentUserId?: string;
  statusOptions?: string[];
  showProject?: boolean;
  projectName?: string;
  emptyMessage?: string;
  onStatusChange?: (issueId: string, status: string) => Promise<void>;
  onPriorityChange?: (issueId: string, priority: string) => Promise<void>;
  onAssigneeChange?: (
    issueId: string,
    assigneeId: string | null
  ) => Promise<void>;
}

export function IssueList({
  issues,
  teamMembers = [],
  currentUserId,
  statusOptions = [],
  showProject,
  projectName,
  emptyMessage = "No issues found",
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
}: IssueListProps) {
  const [showMyIssues, setShowMyIssues] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Filter issues based on selected filters
  const filteredIssues = useMemo(() => {
    let result = issues;

    // Filter by "My Issues"
    if (showMyIssues && currentUserId) {
      result = result.filter((issue) => issue.assignee?.id === currentUserId);
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((issue) => issue.status === statusFilter);
    }

    return result;
  }, [issues, showMyIssues, currentUserId, statusFilter]);

  const hasActiveFilters = showMyIssues || statusFilter;
  const showFilters = currentUserId || statusOptions.length > 0;

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* My Issues Toggle */}
          {currentUserId && (
            <button
              onClick={() => setShowMyIssues(!showMyIssues)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                showMyIssues
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <User className="w-3 h-3" />
              My Issues
            </button>
          )}

          {/* Status Filter Dropdown */}
          {statusOptions.length > 0 && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setShowMyIssues(false);
                setStatusFilter("");
              }}
              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          {/* Results count */}
          {hasActiveFilters && (
            <span className="text-xs text-neutral-500">
              {filteredIssues.length} of {issues.length} issues
            </span>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-neutral-500" />
          </div>
          <h3 className="text-base font-medium text-white mb-1">
            {hasActiveFilters ? "No issues match filters" : emptyMessage}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setShowMyIssues(false);
                setStatusFilter("");
              }}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-lg border border-neutral-700/50">
          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-neutral-700/50 bg-neutral-800/50 rounded-t-lg">
            <div className="w-28 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
              Status
            </div>
            <div className="flex-1 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
              Issue
            </div>
            <div className="hidden md:block w-20 text-[10px] font-medium text-neutral-400 uppercase tracking-wider text-center">
              Labels
            </div>
            <div className="hidden sm:block w-16 text-[10px] font-medium text-neutral-400 uppercase tracking-wider text-center">
              Due
            </div>
            <div className="w-6 text-[10px] font-medium text-neutral-400 uppercase tracking-wider text-center">
              Pri
            </div>
            <div className="w-7 text-[10px] font-medium text-neutral-400 uppercase tracking-wider text-center"></div>
            <div className="w-5" /> {/* More options */}
          </div>

          {/* Issue rows */}
          <div>
            {filteredIssues.map((issue) => (
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
      )}
    </div>
  );
}

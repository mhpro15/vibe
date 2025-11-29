"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Calendar, MessageSquare, ChevronUp, ChevronDown, Minus } from "lucide-react";

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
  HIGH: <ChevronUp className="w-3.5 h-3.5" />,
  MEDIUM: <Minus className="w-3.5 h-3.5" />,
  LOW: <ChevronDown className="w-3.5 h-3.5" />,
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
            <p className="text-sm text-neutral-500 mt-1">
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
            <span className="text-xs text-neutral-500 px-1">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-700/50">
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
                  ? "text-red-400"
                  : "text-neutral-500"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {new Date(issue.dueDate).toLocaleDateString()}
            </span>
          )}

          {/* Comments count */}
          {issue._count && issue._count.comments > 0 && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <MessageSquare className="w-3.5 h-3.5" />
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

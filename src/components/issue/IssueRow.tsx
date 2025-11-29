"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  Circle,
  CheckCircle2,
  Clock,
  ChevronUp,
  ChevronDown,
  Minus,
  Calendar,
  MoreHorizontal,
  User,
} from "lucide-react";

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

interface IssueRowProps {
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
  teamMembers?: TeamMember[];
  onStatusChange?: (issueId: string, status: string) => Promise<void>;
  onPriorityChange?: (issueId: string, priority: string) => Promise<void>;
  onAssigneeChange?: (issueId: string, assigneeId: string | null) => Promise<void>;
  showProject?: boolean;
  projectName?: string;
}

const statusConfig = {
  BACKLOG: {
    icon: Circle,
    label: "Backlog",
    color: "text-neutral-400",
    bg: "bg-neutral-700/30",
  },
  IN_PROGRESS: {
    icon: Clock,
    label: "In Progress",
    color: "text-violet-400",
    bg: "bg-violet-500/20",
  },
  DONE: {
    icon: CheckCircle2,
    label: "Done",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
};

const priorityConfig = {
  HIGH: {
    icon: ChevronUp,
    label: "High",
    color: "text-red-400",
  },
  MEDIUM: {
    icon: Minus,
    label: "Medium",
    color: "text-amber-400",
  },
  LOW: {
    icon: ChevronDown,
    label: "Low",
    color: "text-neutral-400",
  },
};

export function IssueRow({
  issue,
  teamMembers = [],
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  showProject,
  projectName,
}: IssueRowProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityMenu(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const status = statusConfig[issue.status as keyof typeof statusConfig] || statusConfig.BACKLOG;
  const priority = priorityConfig[issue.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;

  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== "DONE";

  const handleStatusChange = (newStatus: string) => {
    setShowStatusMenu(false);
    if (onStatusChange) {
      startTransition(() => {
        onStatusChange(issue.id, newStatus);
      });
    }
  };

  const handlePriorityChange = (newPriority: string) => {
    setShowPriorityMenu(false);
    if (onPriorityChange) {
      startTransition(() => {
        onPriorityChange(issue.id, newPriority);
      });
    }
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    setShowAssigneeMenu(false);
    if (onAssigneeChange) {
      startTransition(() => {
        onAssigneeChange(issue.id, assigneeId);
      });
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {/* Status Dropdown */}
      <div ref={statusRef} className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowStatusMenu(!showStatusMenu);
          }}
          className={`p-1 rounded hover:bg-neutral-700/50 transition-colors ${status.color}`}
          title={status.label}
        >
          <StatusIcon className="w-4 h-4" />
        </button>

        {showStatusMenu && (
          <div className="absolute left-0 top-full mt-1 z-50 w-40 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStatusChange(key);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800 transition-colors ${
                    issue.status === key ? "bg-neutral-800" : ""
                  }`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-neutral-200">{config.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Title & Labels */}
      <Link
        href={`/projects/${issue.projectId}/issues/${issue.id}`}
        className="flex-1 min-w-0 flex items-center gap-2"
      >
        <span className="text-sm text-white truncate hover:text-neutral-300 transition-colors">
          {issue.title}
        </span>
        {showProject && projectName && (
          <span className="text-xs text-neutral-500 shrink-0">
            in {projectName}
          </span>
        )}
      </Link>

      {/* Labels */}
      <div className="hidden md:flex items-center gap-1 shrink-0">
        {issue.labels.slice(0, 2).map((label) => (
          <Badge key={label.id} color={label.color} className="text-xs">
            {label.name}
          </Badge>
        ))}
        {issue.labels.length > 2 && (
          <span className="text-xs text-neutral-500">
            +{issue.labels.length - 2}
          </span>
        )}
      </div>

      {/* Due Date */}
      {issue.dueDate && (
        <div
          className={`hidden sm:flex items-center gap-1 text-xs shrink-0 ${
            isOverdue ? "text-red-400" : "text-neutral-500"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      )}

      {/* Priority Dropdown */}
      <div ref={priorityRef} className="relative shrink-0">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowPriorityMenu(!showPriorityMenu);
          }}
          className={`p-1 rounded hover:bg-neutral-700/50 transition-colors ${priority.color}`}
          title={`Priority: ${priority.label}`}
        >
          <PriorityIcon className="w-4 h-4" />
        </button>

        {showPriorityMenu && (
          <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
            {Object.entries(priorityConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePriorityChange(key);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800 transition-colors ${
                    issue.priority === key ? "bg-neutral-800" : ""
                  }`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-neutral-200">{config.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignee Dropdown */}
      <div ref={assigneeRef} className="relative shrink-0">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowAssigneeMenu(!showAssigneeMenu);
          }}
          className="p-0.5 rounded hover:bg-neutral-700/50 transition-colors"
          title={issue.assignee?.name || "Unassigned"}
        >
          {issue.assignee ? (
            <Avatar
              src={issue.assignee.image}
              name={issue.assignee.name}
              size="sm"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 border-dashed flex items-center justify-center">
              <User className="w-3 h-3 text-neutral-500" />
            </div>
          )}
        </button>

        {showAssigneeMenu && teamMembers.length > 0 && (
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAssigneeChange(null);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800 transition-colors ${
                !issue.assignee ? "bg-neutral-800" : ""
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <User className="w-3 h-3 text-neutral-500" />
              </div>
              <span className="text-neutral-400">Unassigned</span>
            </button>
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAssigneeChange(member.id);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-800 transition-colors ${
                  issue.assignee?.id === member.id ? "bg-neutral-800" : ""
                }`}
              >
                <Avatar src={member.image} name={member.name} size="sm" />
                <span className="text-neutral-200 truncate">{member.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* More options indicator on hover */}
      <Link
        href={`/projects/${issue.projectId}/issues/${issue.id}`}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700/50 transition-all text-neutral-400 hover:text-white"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Link>
    </div>
  );
}

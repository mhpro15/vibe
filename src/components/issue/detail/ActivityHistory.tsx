"use client";

import { IssueActivityType } from "@/generated/prisma/client";
import { Avatar } from "@/components/ui/Avatar";
import { 
  History, 
  PlusCircle, 
  MessageSquare, 
  CheckCircle2, 
  UserPlus, 
  Tag, 
  ArrowRight,
  Pencil
} from "lucide-react";

interface Activity {
  id: string;
  type: IssueActivityType;
  details: any;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface ActivityHistoryProps {
  activities: Activity[];
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatEnum(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatField(field: string | null | undefined) {
  if (!field) return "Issue";
  const formatted = field
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function ActivityHistory({ activities }: ActivityHistoryProps) {
  if (!activities || activities.length === 0) return null;

  const getActivityIcon = (type: IssueActivityType) => {
    switch (type) {
      case "ISSUE_CREATED": return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case "COMMENT_ADDED": return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case "STATUS_CHANGED": return <ArrowRight className="w-4 h-4 text-amber-400" />;
      case "ASSIGNEE_CHANGED": return <UserPlus className="w-4 h-4 text-violet-400" />;
      case "SUBTASK_ADDED": return <PlusCircle className="w-4 h-4 text-neutral-400" />;
      case "SUBTASK_TOGGLED": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "LABEL_ADDED": return <Tag className="w-4 h-4 text-pink-400" />;
      case "ISSUE_UPDATED": return <Pencil className="w-4 h-4 text-neutral-400" />;
      default: return <History className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getActivityContent = (activity: Activity) => {
    const { type, details, user } = activity;
    
    switch (type) {
      case "ISSUE_CREATED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> created this issue
          </span>
        );
      case "COMMENT_ADDED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> added a comment
          </span>
        );
      case "STATUS_CHANGED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> changed status from <span className="text-neutral-300">{formatEnum(details.from)}</span> to <span className="text-white">{formatEnum(details.to)}</span>
          </span>
        );
      case "PRIORITY_CHANGED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> changed priority from <span className="text-neutral-300">{formatEnum(details.from)}</span> to <span className="text-white">{formatEnum(details.to)}</span>
          </span>
        );
      case "ASSIGNEE_CHANGED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> assigned this issue to <span className="text-white">{details.to || "Unassigned"}</span>
          </span>
        );
      case "SUBTASK_ADDED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> added subtask <span className="text-white">&quot;{details.title}&quot;</span>
          </span>
        );
      case "SUBTASK_TOGGLED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> marked subtask <span className="text-white">&quot;{details.title}&quot;</span> as <span className="text-white">{details.isCompleted ? "completed" : "incomplete"}</span>
          </span>
        );
      case "ISSUE_UPDATED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> updated the {formatField(details.field)}
          </span>
        );
      case "LABEL_ADDED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> added label <span className="text-white">{details.labelName}</span>
          </span>
        );
      case "LABEL_REMOVED":
        return (
          <span>
            <span className="font-medium text-white">{user.name}</span> removed label <span className="text-white">{details.labelName}</span>
          </span>
        );
      default:
        return <span><span className="font-medium text-white">{user.name}</span> performed an action</span>;
    }
  };

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 overflow-hidden">
      <div className="p-4 border-b border-neutral-700/50 flex items-center gap-2">
        <History className="w-4 h-4 text-neutral-400" />
        <h3 className="text-sm font-semibold text-white">Activity History</h3>
      </div>
      <div className="p-4 space-y-6">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-3">
            {/* Connector line */}
            {index !== activities.length - 1 && (
              <div className="absolute left-[15px] top-[30px] bottom-[-24px] w-[2px] bg-neutral-800" />
            )}
            
            <div className="relative z-10 shrink-0">
              <Avatar 
                src={activity.user.image} 
                name={activity.user.name} 
                size="sm" 
              />
              <div className="absolute -bottom-1 -right-1 bg-neutral-900 rounded-full p-0.5 border border-neutral-800">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-xs font-medium text-neutral-300 mb-0.5">
                {formatEnum(activity.type)}
              </div>
              <div className="text-sm text-neutral-400 leading-relaxed">
                {getActivityContent(activity)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                {formatRelativeTime(activity.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

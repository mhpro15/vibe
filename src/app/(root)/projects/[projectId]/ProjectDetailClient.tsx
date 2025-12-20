"use client";

import { useState, useTransition, useOptimistic } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  ProjectSettings,
  KanbanBoard,
  ProjectDashboard,
} from "@/components/project";
import { IssueList } from "@/components/issue";
import { toggleFavoriteProjectAction } from "@/lib/actions/project";
import {
  changeStatusAction,
  assignIssueAction,
  changePriorityAction,
} from "@/lib/actions/issue";
import {
  Star,
  Plus,
  ClipboardList,
  LayoutGrid,
  Settings,
  Archive,
  BarChart3,
  Layers,
} from "lucide-react";

function getProjectColor(name: string): string {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-blue-700",
    "from-emerald-500 to-emerald-700",
    "from-rose-500 to-rose-700",
    "from-amber-500 to-amber-700",
    "from-cyan-500 to-cyan-700",
    "from-pink-500 to-pink-700",
    "from-indigo-500 to-indigo-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Subtask {
  id: string;
  isCompleted: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  image?: string | null;
}

interface KanbanIssue {
  id: string;
  title: string;
  status: string;
  priority: string;
  position: number;
  dueDate: Date | null;
  projectId: string;
  assignee: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  labels: Label[];
  subtasks: Subtask[];
}

interface CustomStatus {
  id: string;
  name: string;
  color: string | null;
  position: number;
  wipLimit?: number | null;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  isArchived: boolean;
  isFavorite: boolean;
  team: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string;
    image?: string | null;
  };
  labels: Label[];
  customStatuses: CustomStatus[];
  _count: {
    issues: number;
  };
}

interface ProjectDetailClientProps {
  project: Project;
  canEdit: boolean;
  issues: KanbanIssue[];
  teamMembers?: TeamMember[];
  currentUserId?: string;
  initialTab?: "dashboard" | "issues" | "board" | "settings";
}

export function ProjectDetailClient({
  project,
  canEdit,
  issues,
  teamMembers = [],
  currentUserId,
  initialTab = "dashboard",
}: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "issues" | "board" | "settings"
  >(initialTab);

  const [optimisticProject, addOptimisticProject] = useOptimistic(
    project,
    (state, update: Partial<Project>) => ({ ...state, ...update })
  );

  const [optimisticIssues, addOptimisticIssues] = useOptimistic(
    issues,
    (state, update: { type: string; issueId: string; payload: any }) => {
      switch (update.type) {
        case "update_issue":
          return state.map((issue) =>
            issue.id === update.issueId
              ? { ...issue, ...update.payload }
              : issue
          );
        default:
          return state;
      }
    }
  );

  const [, startTransition] = useTransition();

  const handleToggleFavorite = () => {
    addOptimisticProject({ isFavorite: !optimisticProject.isFavorite });
    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", project.id);
      await toggleFavoriteProjectAction({ success: false }, formData);
    });
  };

  const handleStatusChange = async (issueId: string, status: string) => {
    addOptimisticIssues({
      type: "update_issue",
      issueId,
      payload: { status },
    });

    startTransition(async () => {
      const formData = new FormData();
      formData.set("issueId", issueId);
      formData.set("status", status);
      await changeStatusAction({ success: false }, formData);
    });
  };

  const handleAssigneeChange = async (
    issueId: string,
    assigneeId: string | null
  ) => {
    const newAssignee = assigneeId
      ? teamMembers.find((m) => m.id === assigneeId) || null
      : null;

    addOptimisticIssues({
      type: "update_issue",
      issueId,
      payload: { assignee: newAssignee },
    });

    startTransition(async () => {
      const formData = new FormData();
      formData.set("issueId", issueId);
      formData.set("assigneeId", assigneeId || "");
      await assignIssueAction({ success: false }, formData);
    });
  };

  const handlePriorityChange = async (issueId: string, priority: string) => {
    addOptimisticIssues({
      type: "update_issue",
      issueId,
      payload: { priority },
    });

    startTransition(async () => {
      const formData = new FormData();
      formData.set("issueId", issueId);
      formData.set("priority", priority);
      await changePriorityAction({ success: false }, formData);
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl bg-linear-to-br ${getProjectColor(
              optimisticProject.name
            )} flex items-center justify-center shadow-lg`}
          >
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {optimisticProject.name}
              </h1>
              {optimisticProject.isArchived && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-neutral-700/50 text-neutral-400">
                  <Archive className="w-3 h-3" />
                  Archived
                </span>
              )}
              <button
                onClick={handleToggleFavorite}
                className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    optimisticProject.isFavorite
                      ? "text-amber-400 fill-current"
                      : "text-neutral-500 hover:text-amber-400"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
              <Link
                href={`/teams/${optimisticProject.team.id}`}
                className="hover:text-white transition-colors"
              >
                {optimisticProject.team.name}
              </Link>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Avatar
                  src={optimisticProject.owner.image}
                  name={optimisticProject.owner.name}
                  size="xs"
                />
                <span>{optimisticProject.owner.name}</span>
              </div>
              <span>•</span>
              <span>{optimisticProject._count.issues} issues</span>
            </div>
          </div>
        </div>

        <Link href={`/projects/${optimisticProject.id}/issues/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Issue
          </Button>
        </Link>
      </div>

      {optimisticProject.description && (
        <p className="text-neutral-400 mb-6 max-w-3xl whitespace-pre-wrap">
          {optimisticProject.description}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-neutral-700/50">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "border-white text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "issues"
              ? "border-white text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Issues
        </button>
        <button
          onClick={() => setActiveTab("board")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "board"
              ? "border-white text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Board
        </button>
        {canEdit && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === "settings"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <ProjectDashboard projectId={optimisticProject.id} />
      )}

      {activeTab === "issues" && (
        <div className="space-y-4">
          {/* Issues List */}
          {optimisticIssues.length === 0 ? (
            <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">
                  No issues yet
                </h3>
                <p className="text-neutral-500 mb-4">
                  Create your first issue to get started
                </p>
              </div>
            </div>
          ) : (
            <IssueList
              issues={optimisticIssues}
              teamMembers={teamMembers}
              currentUserId={currentUserId}
              statusOptions={
                optimisticProject.customStatuses.length > 0
                  ? optimisticProject.customStatuses.map((s) => s.name)
                  : [
                      "BACKLOG",
                      "TODO",
                      "IN_PROGRESS",
                      "IN_REVIEW",
                      "DONE",
                      "CANCELLED",
                    ]
              }
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
            />
          )}
        </div>
      )}

      {activeTab === "board" && (
        <KanbanBoard
          projectId={optimisticProject.id}
          issues={optimisticIssues}
          customStatuses={optimisticProject.customStatuses}
        />
      )}

      {activeTab === "settings" && (
        <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-6">
          <ProjectSettings project={optimisticProject} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
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
import { changeStatusAction, assignIssueAction } from "@/lib/actions/issue";
import {
  Star,
  Plus,
  ClipboardList,
  LayoutGrid,
  Settings,
  Archive,
  BarChart3,
} from "lucide-react";

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
}

export function ProjectDetailClient({
  project,
  canEdit,
  issues,
  teamMembers = [],
}: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "issues" | "board" | "settings"
  >("dashboard");
  const [isFavorite, setIsFavorite] = useState(project.isFavorite);
  const [localIssues, setLocalIssues] = useState(issues);
  const [, startTransition] = useTransition();

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", project.id);
      await toggleFavoriteProjectAction({ success: false }, formData);
    });
  };

  const handleStatusChange = async (issueId: string, status: string) => {
    // Optimistic update
    setLocalIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, status } : issue
      )
    );

    const formData = new FormData();
    formData.set("issueId", issueId);
    formData.set("status", status);
    await changeStatusAction({ success: false }, formData);
  };

  const handleAssigneeChange = async (issueId: string, assigneeId: string | null) => {
    // Find the new assignee from team members
    const newAssignee = assigneeId
      ? teamMembers.find((m) => m.id === assigneeId) || null
      : null;

    // Optimistic update
    setLocalIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? { ...issue, assignee: newAssignee }
          : issue
      )
    );

    const formData = new FormData();
    formData.set("issueId", issueId);
    formData.set("assigneeId", assigneeId || "");
    await assignIssueAction({ success: false }, formData);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              {project.isArchived && (
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
                    isFavorite
                      ? "text-amber-400 fill-current"
                      : "text-neutral-500 hover:text-amber-400"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
              <Link
                href={`/teams/${project.team.id}`}
                className="hover:text-white transition-colors"
              >
                {project.team.name}
              </Link>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Avatar
                  src={project.owner.image}
                  name={project.owner.name}
                  size="xs"
                />
                <span>{project.owner.name}</span>
              </div>
              <span>•</span>
              <span>{project._count.issues} issues</span>
            </div>
          </div>
        </div>

        <Link href={`/projects/${project.id}/issues/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Issue
          </Button>
        </Link>
      </div>

      {project.description && (
        <p className="text-neutral-400 mb-6 max-w-3xl whitespace-pre-wrap">{project.description}</p>
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
      {activeTab === "dashboard" && <ProjectDashboard projectId={project.id} />}

      {activeTab === "issues" && (
        <div className="space-y-4">
          {/* Header with Create button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Issues ({localIssues.length})
            </h2>
            <Link href={`/projects/${project.id}/issues/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Issue
              </Button>
            </Link>
          </div>

          {/* Issues List */}
          {localIssues.length === 0 ? (
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
              issues={localIssues}
              teamMembers={teamMembers}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
            />
          )}
        </div>
      )}

      {activeTab === "board" && (
        <KanbanBoard
          projectId={project.id}
          issues={localIssues}
          customStatuses={project.customStatuses}
        />
      )}

      {activeTab === "settings" && (
        <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-6">
          <ProjectSettings project={project} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}

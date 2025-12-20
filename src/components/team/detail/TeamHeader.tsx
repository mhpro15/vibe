"use client";

import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  Plus,
  UserPlus,
  LogOut,
  Trash2,
  Users,
  Layers,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function getTeamColor(name: string): string {
  const colors = [
    "from-violet-600/20 to-violet-800/20 border-violet-500/30",
    "from-blue-600/20 to-blue-800/20 border-blue-500/30",
    "from-emerald-600/20 to-emerald-800/20 border-emerald-500/30",
    "from-rose-600/20 to-rose-800/20 border-rose-500/30",
    "from-amber-600/20 to-amber-800/20 border-amber-500/30",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface TeamHeaderProps {
  team: {
    id: string;
    name: string;
    memberCount: number;
    projectCount: number;
    createdAt: string;
  };
  isEditing: boolean;
  teamName: string;
  isUpdating: boolean;
  isDeleting: boolean;
  isLeaving: boolean;
  canEdit: boolean;
  canInvite: boolean;
  isOwner: boolean;
  setTeamName: (name: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  handleUpdateName: () => void;
  handleDeleteTeam: () => void;
  handleLeaveTeam: () => void;
  setIsInviteModalOpen: (isOpen: boolean) => void;
  setIsCreateProjectModalOpen: (isOpen: boolean) => void;
}

export function TeamHeader({
  team,
  isEditing,
  teamName,
  isUpdating,
  isDeleting,
  isLeaving,
  canEdit,
  canInvite,
  isOwner,
  setTeamName,
  setIsEditing,
  handleUpdateName,
  handleDeleteTeam,
  handleLeaveTeam,
  setIsInviteModalOpen,
  setIsCreateProjectModalOpen,
}: TeamHeaderProps) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-6">
        <Link href="/teams" className="hover:text-white transition-colors">
          Teams
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{team.name}</span>
      </div>

      {/* Team Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl bg-linear-to-br ${getTeamColor(team.name)} border flex items-center justify-center shrink-0`}>
            <Users className="w-8 h-8 text-violet-400" />
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-violet-500/50 focus:border-violet-400 focus:outline-none text-white w-full sm:w-auto"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button
                    size="sm"
                    onClick={handleUpdateName}
                    isLoading={isUpdating}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setTeamName(team.name);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white wrap-break-word">{team.name}</h1>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {team.memberCount} members
              </span>
              <span className="hidden sm:inline text-neutral-600">•</span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                {team.projectCount} projects
              </span>
              <span className="hidden sm:inline text-neutral-600">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Created {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {canInvite && (
            <>
              <Button
                onClick={() => setIsCreateProjectModalOpen(true)}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button onClick={() => setIsInviteModalOpen(true)} className="flex-1 sm:flex-none">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </>
          )}
          {!isOwner && (
            <Button
              variant="outline"
              onClick={handleLeaveTeam}
              isLoading={isLeaving}
              className="flex-1 sm:flex-none"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Team
            </Button>
          )}
          {isOwner && (
            <Button
              variant="danger"
              onClick={handleDeleteTeam}
              isLoading={isDeleting}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Team
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

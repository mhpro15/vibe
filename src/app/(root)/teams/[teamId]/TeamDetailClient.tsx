"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  Plus,
  UserPlus,
  LogOut,
  Trash2,
  FolderKanban,
  Users,
  Calendar,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TeamMembersList, InviteMemberModal } from "@/components/team";
import { CreateProjectModal } from "@/components/project";
import {
  deleteTeamAction,
  leaveTeamAction,
  updateTeamAction,
} from "@/lib/actions/team";

interface TeamMember {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface TeamData {
  id: string;
  name: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  memberCount: number;
  projectCount: number;
  members: TeamMember[];
}

interface TeamDetailClientProps {
  team: TeamData;
  currentUserId: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
}

export function TeamDetailClient({
  team,
  currentUserId,
  currentUserRole,
}: TeamDetailClientProps) {
  const router = useRouter();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const canInvite = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin;

  const handleUpdateName = async () => {
    if (teamName.trim() === team.name) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    const formData = new FormData();
    formData.append("teamId", team.id);
    formData.append("name", teamName.trim());

    const result = await updateTeamAction({ success: false }, formData);
    setIsUpdating(false);

    if (result.success) {
      setIsEditing(false);
      router.refresh();
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this team? This action cannot be undone."
      )
    )
      return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.append("teamId", team.id);

    const result = await deleteTeamAction({ success: false }, formData);
    setIsDeleting(false);

    if (result.success) {
      router.push("/teams");
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return;

    setIsLeaving(true);
    const formData = new FormData();
    formData.append("teamId", team.id);

    const result = await leaveTeamAction({ success: false }, formData);
    setIsLeaving(false);

    if (result.success) {
      router.push("/teams");
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-6">
        <Link href="/teams" className="hover:text-white transition-colors">
          Teams
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{team.name}</span>
      </div>

      {/* Team Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-linear-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-2xl">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-violet-500/50 focus:border-violet-400 focus:outline-none text-white"
                  autoFocus
                />
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
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{team.name}</h1>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {team.memberCount} members
              </span>
              <span className="text-neutral-600">•</span>
              <span className="flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4" />
                {team.projectCount} projects
              </span>
              <span className="text-neutral-600">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Created {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canInvite && (
            <>
              <Button
                onClick={() => setIsCreateProjectModalOpen(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button onClick={() => setIsInviteModalOpen(true)}>
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
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Team
            </Button>
          )}
        </div>
      </div>

      {/* Team Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Team Members
                </h2>
                <Badge variant="default">{team.memberCount} members</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TeamMembersList
                members={team.members}
                teamId={team.id}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onMemberRemoved={() => router.refresh()}
                onRoleChanged={() => router.refresh()}
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">
                Quick Actions
              </h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/projects?team=${team.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 border border-transparent hover:border-neutral-700/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/50 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
                  <FolderKanban className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    View Projects
                  </p>
                  <p className="text-sm text-neutral-500">
                    {team.projectCount} projects
                  </p>
                </div>
              </Link>
              {canInvite && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 border border-transparent hover:border-neutral-700/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center group-hover:border-emerald-600/50 transition-colors">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">
                      Invite Members
                    </p>
                    <p className="text-sm text-neutral-500">
                      Add team members
                    </p>
                  </div>
                </button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">
                Your Role
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  currentUserRole === "OWNER" 
                    ? "bg-amber-900/30 border border-amber-700/30" 
                    : currentUserRole === "ADMIN"
                    ? "bg-violet-900/30 border border-violet-700/30"
                    : "bg-neutral-800 border border-neutral-700/50"
                }`}>
                  {currentUserRole === "OWNER" && <Crown className="w-5 h-5 text-amber-400" />}
                  {currentUserRole === "ADMIN" && <Shield className="w-5 h-5 text-violet-400" />}
                  {currentUserRole === "MEMBER" && <User className="w-5 h-5 text-neutral-400" />}
                </div>
                <div>
                  <Badge
                    variant={
                      currentUserRole === "OWNER"
                        ? "warning"
                        : currentUserRole === "ADMIN"
                        ? "primary"
                        : "default"
                    }
                    size="md"
                  >
                    {currentUserRole}
                  </Badge>
                  <p className="text-sm text-neutral-400 mt-1">
                    {currentUserRole === "OWNER" && "Full control over the team"}
                    {currentUserRole === "ADMIN" && "Can manage projects and members"}
                    {currentUserRole === "MEMBER" && "Can view and work on projects"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teamId={team.id}
        onSuccess={() => router.refresh()}
      />

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        teamId={team.id}
        teamName={team.name}
      />
    </div>
  );
}

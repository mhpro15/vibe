"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TeamMembersList, InviteMemberModal } from "@/components/team";
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
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <Link
          href="/teams"
          className="hover:text-gray-900 dark:hover:text-white"
        >
          Teams
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-gray-900 dark:text-white">{team.name}</span>
      </div>

      {/* Team Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none"
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {team.name}
                </h1>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>{team.memberCount} members</span>
              <span>•</span>
              <span>{team.projectCount} projects</span>
              <span>•</span>
              <span>
                Created {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canInvite && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Invite Member
            </Button>
          )}
          {!isOwner && (
            <Button
              variant="outline"
              onClick={handleLeaveTeam}
              isLoading={isLeaving}
            >
              Leave Team
            </Button>
          )}
          {isOwner && (
            <Button
              variant="danger"
              onClick={handleDeleteTeam}
              isLoading={isDeleting}
            >
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Members
                </h2>
                <Badge>{team.memberCount} members</Badge>
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/projects?team=${team.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    View Projects
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {team.projectCount} projects
                  </p>
                </div>
              </Link>
              {canInvite && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Invite Members
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add team members
                    </p>
                  </div>
                </button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Role
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    currentUserRole === "OWNER"
                      ? "primary"
                      : currentUserRole === "ADMIN"
                      ? "info"
                      : "default"
                  }
                  size="md"
                >
                  {currentUserRole}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentUserRole === "OWNER" && "Full control over the team"}
                  {currentUserRole === "ADMIN" &&
                    "Can manage projects and members"}
                  {currentUserRole === "MEMBER" &&
                    "Can view and work on projects"}
                </span>
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
    </div>
  );
}

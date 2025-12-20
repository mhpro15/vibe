"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  BarChart3,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  InviteMemberModal,
  TeamStatistics,
  ManageInvitations,
  TeamHeader,
  TeamMembersTab,
} from "@/components/team";

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

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
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
  pendingInvites: PendingInvite[];
}

export function TeamDetailClient({
  team,
  currentUserId,
  currentUserRole,
  pendingInvites,
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
  const [activeTab, setActiveTab] = useState<"members" | "statistics" | "invitations">(
    "members"
  );

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
      <TeamHeader
        team={team}
        isEditing={isEditing}
        teamName={teamName}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        isLeaving={isLeaving}
        canEdit={canEdit}
        canInvite={canInvite}
        isOwner={isOwner}
        setTeamName={setTeamName}
        setIsEditing={setIsEditing}
        handleUpdateName={handleUpdateName}
        handleDeleteTeam={handleDeleteTeam}
        handleLeaveTeam={handleLeaveTeam}
        setIsInviteModalOpen={setIsInviteModalOpen}
        setIsCreateProjectModalOpen={setIsCreateProjectModalOpen}
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-neutral-700/50 overflow-x-auto whitespace-nowrap pb-1">
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "members"
              ? "border-white text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Members
        </button>
        <button
          onClick={() => setActiveTab("statistics")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "statistics"
              ? "border-white text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Statistics
        </button>
        {canInvite && pendingInvites.length > 0 && (
          <button
            onClick={() => setActiveTab("invitations")}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === "invitations"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Mail className="w-4 h-4" />
            Pending Invites
            <Badge variant="default" className="ml-1 text-xs">
              {pendingInvites.length}
            </Badge>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "members" && (
        <TeamMembersTab
          team={team}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          canInvite={canInvite}
          onMemberRemoved={() => router.refresh()}
          onRoleChanged={() => router.refresh()}
          setIsInviteModalOpen={setIsInviteModalOpen}
        />
      )}

      {activeTab === "statistics" && <TeamStatistics teamId={team.id} />}

      {activeTab === "invitations" && canInvite && (
        <ManageInvitations
          invitations={pendingInvites}
          teamId={team.id}
          onInviteCancelled={() => router.refresh()}
        />
      )}

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

"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { kickMemberAction, changeRoleAction } from "@/lib/actions/team";

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

interface TeamMembersListProps {
  members: TeamMember[];
  teamId: string;
  currentUserId: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  onMemberRemoved?: () => void;
  onRoleChanged?: () => void;
}

export function TeamMembersList({
  members,
  teamId,
  currentUserId,
  currentUserRole,
  onMemberRemoved,
  onRoleChanged,
}: TeamMembersListProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  const canManageMembers =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const isOwner = currentUserRole === "OWNER";

  const handleKickMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?"))
      return;

    setLoadingMemberId(memberId);
    const formData = new FormData();
    formData.append("teamId", teamId);
    formData.append("memberId", memberId);

    const result = await kickMemberAction({ success: false }, formData);
    setLoadingMemberId(null);

    if (result.success) {
      onMemberRemoved?.();
    }
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: "ADMIN" | "MEMBER" | "OWNER"
  ) => {
    if (newRole === "OWNER") {
      if (
        !confirm(
          "Are you sure you want to transfer ownership? You will become an Admin."
        )
      )
        return;
    }

    setLoadingMemberId(memberId);
    const formData = new FormData();
    formData.append("teamId", teamId);
    formData.append("memberId", memberId);
    formData.append("newRole", newRole);

    const result = await changeRoleAction({ success: false }, formData);
    setLoadingMemberId(null);

    if (result.success) {
      onRoleChanged?.();
    }
  };

  const roleColors = {
    OWNER: "primary" as const,
    ADMIN: "info" as const,
    MEMBER: "default" as const,
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const isMemberOwner = member.role === "OWNER";
        const canChangeRole = isOwner && !isCurrentUser;
        const canKick =
          canManageMembers &&
          !isCurrentUser &&
          !isMemberOwner &&
          (isOwner ||
            (currentUserRole === "ADMIN" && member.role === "MEMBER"));

        return (
          <div
            key={member.id}
            className="py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={member.user.image}
                name={member.user.name}
                size="lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {member.user.name}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-gray-500">(you)</span>
                  )}
                  <Badge variant={roleColors[member.role]} size="sm">
                    {member.role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {member.user.email}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {(canChangeRole || canKick) && (
              <div className="flex items-center gap-2">
                {canChangeRole && (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(
                        member.id,
                        e.target.value as "ADMIN" | "MEMBER" | "OWNER"
                      )
                    }
                    disabled={loadingMemberId === member.id}
                    className="text-sm px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Transfer Ownership</option>
                  </select>
                )}

                {canKick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleKickMember(member.id)}
                    disabled={loadingMemberId === member.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {loadingMemberId === member.id ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

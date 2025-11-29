"use client";

import { useState } from "react";
import { Crown, Shield, User, Trash2, Loader2 } from "lucide-react";
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
    OWNER: "warning" as const,
    ADMIN: "primary" as const,
    MEMBER: "default" as const,
  };

  const RoleIcon = ({ role }: { role: "OWNER" | "ADMIN" | "MEMBER" }) => {
    if (role === "OWNER") return <Crown className="w-4 h-4 text-amber-400" />;
    if (role === "ADMIN") return <Shield className="w-4 h-4 text-violet-400" />;
    return <User className="w-4 h-4 text-neutral-400" />;
  };

  return (
    <div className="divide-y divide-neutral-800">
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
            className="py-4 flex items-center justify-between first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={member.user.image}
                name={member.user.name}
                size="lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    {member.user.name}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">(you)</span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <RoleIcon role={member.role} />
                    <Badge variant={roleColors[member.role]} size="sm">
                      {member.role}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 mt-0.5">
                  {member.user.email}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
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
                    className="text-sm px-3 py-1.5 border rounded-lg bg-neutral-900 text-white border-neutral-700 hover:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-colors disabled:opacity-50"
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
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    {loadingMemberId === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
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

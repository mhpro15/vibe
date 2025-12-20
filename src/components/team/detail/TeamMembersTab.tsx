"use client";

import Link from "next/link";
import { Users, Layers, UserPlus, Crown, Shield, User } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TeamMembersList } from "@/components/team/TeamMembersList";

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

interface TeamMembersTabProps {
  team: {
    id: string;
    memberCount: number;
    projectCount: number;
    members: TeamMember[];
  };
  currentUserId: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  canInvite: boolean;
  onMemberRemoved: () => void;
  onRoleChanged: () => void;
  setIsInviteModalOpen: (isOpen: boolean) => void;
}

export function TeamMembersTab({
  team,
  currentUserId,
  currentUserRole,
  canInvite,
  onMemberRemoved,
  onRoleChanged,
  setIsInviteModalOpen,
}: TeamMembersTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Members */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Team Members</h2>
              <Badge variant="default">{team.memberCount} members</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TeamMembersList
              members={team.members}
              teamId={team.id}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onMemberRemoved={onMemberRemoved}
              onRoleChanged={onRoleChanged}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Info */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href={`/projects?team=${team.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 border border-transparent hover:border-neutral-700/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/50 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
                <Layers className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-medium text-white">View Projects</p>
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
                  <p className="font-medium text-white">Invite Members</p>
                  <p className="text-sm text-neutral-500">Add team members</p>
                </div>
              </button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Your Role</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/30 border border-neutral-700/50">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  currentUserRole === "OWNER"
                    ? "bg-amber-900/30 border border-amber-700/30"
                    : currentUserRole === "ADMIN"
                    ? "bg-violet-900/30 border border-violet-700/30"
                    : "bg-neutral-800 border border-neutral-700/50"
                }`}
              >
                {currentUserRole === "OWNER" && (
                  <Crown className="w-5 h-5 text-amber-400" />
                )}
                {currentUserRole === "ADMIN" && (
                  <Shield className="w-5 h-5 text-violet-400" />
                )}
                {currentUserRole === "MEMBER" && (
                  <User className="w-5 h-5 text-neutral-400" />
                )}
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
                  {currentUserRole === "ADMIN" &&
                    "Can manage projects and members"}
                  {currentUserRole === "MEMBER" &&
                    "Can view and work on projects"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

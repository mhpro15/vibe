"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TeamList, CreateTeamModal, PendingInvitations } from "@/components/team";
import { getUserTeamsAction } from "@/lib/actions/team";

interface Team {
  id: string;
  name: string;
  memberCount: number;
  projectCount: number;
  role: "OWNER" | "ADMIN" | "MEMBER";
  owner: {
    name: string;
    image?: string | null;
  };
}

interface Invite {
  id: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  team: {
    id: string;
    name: string;
  };
  sender: {
    name: string | null;
    email: string;
  } | null;
}

interface TeamsClientProps {
  initialTeams: Team[];
  initialInvitations: Invite[];
}

export function TeamsClient({ initialTeams, initialInvitations }: TeamsClientProps) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTeams = useCallback(async () => {
    const result = await getUserTeamsAction({ success: false }, new FormData());
    if (result.success && result.teams) {
      setTeams(result.teams);
    }
  }, []);

  const handleTeamCreated = () => {
    fetchTeams();
    router.refresh();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-white">
            Teams
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Manage your teams and collaborate with others
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Team
        </Button>
      </div>

      {/* Pending Invitations */}
      {initialInvitations.length > 0 && (
        <div className="mb-6">
          <PendingInvitations invitations={initialInvitations} />
        </div>
      )}

      <TeamList teams={teams} />

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTeamCreated}
      />
    </div>
  );
}

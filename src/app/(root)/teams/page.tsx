"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TeamList, CreateTeamModal } from "@/components/team";
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

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTeams = useCallback(async () => {
    const result = await getUserTeamsAction({ success: false }, new FormData());
    if (result.success && result.teams) {
      setTeams(result.teams);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadTeams = async () => {
      const result = await getUserTeamsAction({ success: false }, new FormData());
      if (mounted && result.success && result.teams) {
        setTeams(result.teams);
      }
      if (mounted) {
        setIsLoading(false);
      }
    };
    
    loadTeams();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleTeamCreated = () => {
    fetchTeams();
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Teams
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            viewBox="0 0 24 24"
          >
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
        </div>
      ) : (
        <TeamList teams={teams} />
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTeamCreated}
      />
    </div>
  );
}

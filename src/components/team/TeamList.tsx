"use client";

import { TeamCard } from "./TeamCard";

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

interface TeamListProps {
  teams: Team[];
  emptyMessage?: string;
}

export function TeamList({
  teams,
  emptyMessage = "No teams found",
}: TeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          {emptyMessage}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Create a team to start collaborating with others
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}

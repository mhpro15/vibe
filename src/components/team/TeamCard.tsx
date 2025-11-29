"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    memberCount: number;
    projectCount: number;
    role: "OWNER" | "ADMIN" | "MEMBER";
    owner: {
      name: string;
      image?: string | null;
    };
  };
}

export function TeamCard({ team }: TeamCardProps) {
  const router = useRouter();

  const roleColors = {
    OWNER: "primary" as const,
    ADMIN: "info" as const,
    MEMBER: "default" as const,
  };

  return (
    <Card
      hover
      onClick={() => router.push(`/teams/${team.id}`)}
      className="group"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neutral-700 to-neutral-800 border border-neutral-600/50 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-neutral-300 transition-colors">
                {team.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Avatar
                  src={team.owner.image}
                  name={team.owner.name}
                  size="xs"
                />
                <span>{team.owner.name}</span>
              </div>
            </div>
          </div>
          <Badge variant={roleColors[team.role]} size="sm">
            {team.role}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-1.5">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{team.memberCount} members</span>
          </div>
          <div className="flex items-center gap-1.5">
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span>{team.projectCount} projects</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

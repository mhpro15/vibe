"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Star, ClipboardList, Archive, Hexagon } from "lucide-react";

// Generate a consistent color based on project name
function getProjectColor(name: string): string {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600", 
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
    "from-fuchsia-500 to-purple-600",
    "from-sky-500 to-blue-600",
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    isArchived: boolean;
    team: {
      id: string;
      name: string;
    };
    owner: {
      id: string;
      name: string;
      image?: string | null;
    };
    _count: {
      issues: number;
    };
    isFavorite: boolean;
  };
  onToggleFavorite?: (projectId: string) => void;
  showTeam?: boolean;
}

export function ProjectCard({
  project,
  onToggleFavorite,
  showTeam = true,
}: ProjectCardProps) {
  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-700/50 p-3 hover:bg-neutral-800 hover:border-neutral-600 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${getProjectColor(project.name)} flex items-center justify-center shadow-lg shrink-0`}>
              <Hexagon className="w-4 h-4 text-white/90" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-white text-sm truncate group-hover:text-neutral-300 transition-colors">
                  {project.name}
                </h3>
                {project.isArchived && (
                  <Archive className="w-3 h-3 text-neutral-500 shrink-0" title="Archived" />
                )}
              </div>
              {showTeam && (
                <p className="text-xs text-neutral-500 truncate">
                  {project.team.name}
                </p>
              )}
            </div>
          </div>
        </Link>

        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(project.id);
            }}
            className="p-1 hover:bg-neutral-700/50 rounded transition-colors shrink-0"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                project.isFavorite
                  ? "text-amber-400 fill-current"
                  : "text-neutral-500 hover:text-amber-400"
              }`}
            />
          </button>
        )}
      </div>

      {project.description && (
        <p className="text-xs text-neutral-400 line-clamp-1 mb-2 px-0.5">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar
            src={project.owner.image}
            name={project.owner.name}
            size="sm"
          />
          <span className="text-neutral-500 truncate">
            {project.owner.name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-neutral-500 shrink-0">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>{project._count.issues}</span>
        </div>
      </div>
    </div>
  );
}

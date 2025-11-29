"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Star, ClipboardList, Archive } from "lucide-react";

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
    <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-5 hover:bg-neutral-800 hover:border-neutral-600 transition-all group">
      <div className="flex items-start justify-between">
        <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neutral-700 to-neutral-800 border border-neutral-600/50 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white truncate group-hover:text-neutral-300 transition-colors">
                  {project.name}
                </h3>
                {project.isArchived && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-neutral-700/50 text-neutral-400">
                    <Archive className="w-3 h-3" />
                    Archived
                  </span>
                )}
              </div>
              {showTeam && (
                <p className="text-sm text-neutral-500 truncate">
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
            className="p-2 hover:bg-neutral-700/50 rounded-lg transition-colors"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                project.isFavorite
                  ? "text-amber-400 fill-current"
                  : "text-neutral-500 hover:text-amber-400"
              }`}
            />
          </button>
        )}
      </div>

      {project.description && (
        <p className="mt-3 text-sm text-neutral-400 line-clamp-2 whitespace-pre-wrap">
          {project.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar
            src={project.owner.image}
            name={project.owner.name}
            size="sm"
          />
          <span className="text-sm text-neutral-500">
            {project.owner.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <ClipboardList className="w-4 h-4" />
          <span>{project._count.issues} issues</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-800 border border-neutral-600/50 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white truncate group-hover:text-neutral-300 transition-colors">
                  {project.name}
                </h3>
                {project.isArchived && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    Archived
                  </span>
                )}
              </div>
              {showTeam && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className={`w-5 h-5 ${
                project.isFavorite
                  ? "text-yellow-500 fill-current"
                  : "text-gray-400 hover:text-yellow-500"
              }`}
              fill={project.isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        )}
      </div>

      {project.description && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
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
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {project.owner.name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>{project._count.issues} issues</span>
        </div>
      </div>
    </div>
  );
}

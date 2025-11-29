"use client";

import { ProjectCard } from "./ProjectCard";

interface Project {
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
}

interface ProjectListProps {
  projects: Project[];
  onToggleFavorite?: (projectId: string) => void;
  showTeam?: boolean;
  emptyMessage?: string;
}

export function ProjectList({
  projects,
  onToggleFavorite,
  showTeam = true,
  emptyMessage = "No projects found",
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          {emptyMessage}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Create a project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onToggleFavorite={onToggleFavorite}
          showTeam={showTeam}
        />
      ))}
    </div>
  );
}

"use client";

import { ProjectCard } from "./ProjectCard";
import { Layers } from "lucide-react";

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
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center">
          <Layers className="w-8 h-8 text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">
          {emptyMessage}
        </h3>
        <p className="text-neutral-500">
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

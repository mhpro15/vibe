"use client";

import { useState, useTransition } from "react";
import { ProjectList } from "@/components/project";
import { toggleFavoriteProjectAction } from "@/lib/actions/project";

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

interface ProjectsClientProps {
  projects: Project[];
  favorites: Project[];
}

export function ProjectsClient({ projects, favorites }: ProjectsClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [, startTransition] = useTransition();
  const [localProjects, setLocalProjects] = useState(projects);
  const [localFavorites, setLocalFavorites] = useState(favorites);

  const handleToggleFavorite = (projectId: string) => {
    // Optimistic update
    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );

    const project = localProjects.find((p) => p.id === projectId);
    if (project) {
      if (project.isFavorite) {
        setLocalFavorites((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        setLocalFavorites((prev) => [...prev, { ...project, isFavorite: true }]);
      }
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      await toggleFavoriteProjectAction({ success: false }, formData);
    });
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          All Projects ({localProjects.length})
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "favorites"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Favorites ({localFavorites.length})
        </button>
      </div>

      {/* Project List */}
      {activeTab === "all" ? (
        <ProjectList
          projects={localProjects}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="You don't have any projects yet"
        />
      ) : (
        <ProjectList
          projects={localFavorites}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="No favorite projects"
        />
      )}
    </div>
  );
}

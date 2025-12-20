"use client";

import { useState, useTransition, useOptimistic } from "react";
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
  const [isPending, startTransition] = useTransition();

  const [optimisticProjects, toggleOptimisticFavorite] = useOptimistic(
    projects,
    (state, projectId: string) =>
      state.map((p) =>
        p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p
      )
  );

  const optimisticFavorites = optimisticProjects.filter((p) => p.isFavorite);

  const handleToggleFavorite = (projectId: string) => {
    startTransition(async () => {
      toggleOptimisticFavorite(projectId);
      const formData = new FormData();
      formData.set("projectId", projectId);
      await toggleFavoriteProjectAction({ success: false }, formData);
    });
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-neutral-700/50">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "all"
              ? "border-white text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          All Projects ({optimisticProjects.length})
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === "favorites"
              ? "border-white text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Favorites ({optimisticFavorites.length})
        </button>
      </div>

      {/* Project List */}
      {activeTab === "all" ? (
        <ProjectList
          projects={optimisticProjects}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="You don't have any projects yet"
        />
      ) : (
        <ProjectList
          projects={optimisticFavorites}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage="No favorite projects"
        />
      )}
    </div>
  );
}

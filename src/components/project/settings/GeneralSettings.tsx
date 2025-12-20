"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProjectAction, ProjectActionResult } from "@/lib/actions/project";

interface GeneralSettingsProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
  };
  canEdit: boolean;
}

const initialState: ProjectActionResult = {
  success: false,
};

export function GeneralSettings({ project, canEdit }: GeneralSettingsProps) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProjectAction,
    initialState
  );

  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-4">General</h3>
      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="projectId" value={project.id} />

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-400 mb-1"
          >
            Project Name
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={project.name}
            maxLength={100}
            disabled={!canEdit}
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-neutral-400 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={project.description || ""}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none disabled:opacity-50 transition-all"
          />
        </div>

        {updateState.error && (
          <p className="text-sm text-red-600">{updateState.error}</p>
        )}

        {canEdit && (
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </form>
    </section>
  );
}

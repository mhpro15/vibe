"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  deleteProjectAction,
  toggleArchiveProjectAction,
  ProjectActionResult,
} from "@/lib/actions/project";

interface DangerZoneProps {
  project: {
    id: string;
    name: string;
    isArchived: boolean;
  };
  canEdit: boolean;
}

const initialState: ProjectActionResult = {
  success: false,
};

export function DangerZone({ project, canEdit }: DangerZoneProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteProjectAction,
    initialState
  );
  const [_archiveState, archiveAction, isArchiving] = useActionState(
    toggleArchiveProjectAction,
    initialState
  );

  if (!canEdit) return null;

  return (
    <section className="border-t border-neutral-700/50 pt-8">
      <h3 className="text-lg font-semibold text-red-400 mb-4">
        Danger Zone
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-neutral-700/50 rounded-lg">
          <div>
            <p className="font-medium text-white">
              {project.isArchived ? "Unarchive Project" : "Archive Project"}
            </p>
            <p className="text-sm text-neutral-500">
              {project.isArchived
                ? "Make this project visible again"
                : "Hide this project from the main view"}
            </p>
          </div>
          <form action={archiveAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <Button type="submit" variant="outline" disabled={isArchiving}>
              {isArchiving
                ? "..."
                : project.isArchived
                ? "Unarchive"
                : "Archive"}
            </Button>
          </form>
        </div>

        <div className="flex items-center justify-between p-4 border border-red-500/30 rounded-lg bg-red-500/5">
          <div>
            <p className="font-medium text-white">Delete Project</p>
            <p className="text-sm text-neutral-500">
              Permanently delete this project and all its data
            </p>
          </div>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <p className="text-neutral-400 mb-4">
          Are you sure you want to delete{" "}
          <strong className="text-white">{project.name}</strong>? This action
          cannot be undone.
        </p>
        {deleteState.error && (
          <p className="text-sm text-red-400 mb-4">{deleteState.error}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <form action={deleteAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <Button type="submit" variant="danger" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </form>
        </div>
      </Modal>
    </section>
  );
}

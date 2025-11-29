"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  updateProjectAction,
  deleteProjectAction,
  toggleArchiveProjectAction,
  createLabelAction,
  deleteLabelAction,
  createCustomStatusAction,
  deleteCustomStatusAction,
  ProjectActionResult,
} from "@/lib/actions/project";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface CustomStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface ProjectSettingsProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    isArchived: boolean;
    labels: Label[];
    customStatuses: CustomStatus[];
  };
  canEdit: boolean;
}

const initialState: ProjectActionResult = {
  success: false,
};

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

export function ProjectSettings({ project, canEdit }: ProjectSettingsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [newStatusColor, setNewStatusColor] = useState(PRESET_COLORS[4]);

  const [updateState, updateAction, isUpdating] = useActionState(
    updateProjectAction,
    initialState
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteProjectAction,
    initialState
  );
  const [archiveState, archiveAction, isArchiving] = useActionState(
    toggleArchiveProjectAction,
    initialState
  );
  const [labelState, labelAction, isAddingLabel] = useActionState(
    createLabelAction,
    initialState
  );
  const [statusState, statusAction, isAddingStatus] = useActionState(
    createCustomStatusAction,
    initialState
  );

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General
        </h3>
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
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

      {/* Labels */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Labels
          </h3>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddLabelModal(true)}
            >
              Add Label
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {project.labels.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No labels yet</p>
          ) : (
            project.labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${label.color}20` }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: label.color }}
                >
                  {label.name}
                </span>
                {canEdit && (
                  <form action={deleteLabelAction}>
                    <input type="hidden" name="labelId" value={label.id} />
                    <button
                      type="submit"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Custom Statuses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Custom Statuses
          </h3>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddStatusModal(true)}
            >
              Add Status
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {/* Default statuses */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Backlog
            </span>
            <span className="text-xs text-gray-500">(default)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              In Progress
            </span>
            <span className="text-xs text-gray-500">(default)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Done
            </span>
            <span className="text-xs text-gray-500">(default)</span>
          </div>

          {/* Custom statuses */}
          {project.customStatuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {status.name}
                </span>
              </div>
              {canEdit && (
                <form action={deleteCustomStatusAction}>
                  <input type="hidden" name="statusId" value={status.id} />
                  <button
                    type="submit"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      {canEdit && (
        <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {project.isArchived ? "Unarchive Project" : "Archive Project"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project.isArchived
                    ? "Make this project visible again"
                    : "Hide this project from the main view"}
                </p>
              </div>
              <form action={archiveAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isArchiving}
                >
                  {isArchiving
                    ? "..."
                    : project.isArchived
                    ? "Unarchive"
                    : "Archive"}
                </Button>
              </form>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Delete Project
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently delete this project and all its data
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete <strong>{project.name}</strong>? This
          action cannot be undone.
        </p>
        {deleteState.error && (
          <p className="text-sm text-red-600 mb-4">{deleteState.error}</p>
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

      {/* Add Label Modal */}
      <Modal
        isOpen={showAddLabelModal}
        onClose={() => setShowAddLabelModal(false)}
        title="Add Label"
      >
        <form action={labelAction} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="color" value={newLabelColor} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Label Name
            </label>
            <Input name="name" placeholder="e.g., Bug, Feature, Enhancement" maxLength={50} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewLabelColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    newLabelColor === color
                      ? "ring-2 ring-offset-2 ring-blue-500"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {labelState.error && (
            <p className="text-sm text-red-600">{labelState.error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddLabelModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAddingLabel}>
              {isAddingLabel ? "Adding..." : "Add Label"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Custom Status Modal */}
      <Modal
        isOpen={showAddStatusModal}
        onClose={() => setShowAddStatusModal(false)}
        title="Add Custom Status"
      >
        <form action={statusAction} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="color" value={newStatusColor} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status Name
            </label>
            <Input
              name="name"
              placeholder="e.g., In Review, Testing"
              maxLength={30}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewStatusColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    newStatusColor === color
                      ? "ring-2 ring-offset-2 ring-blue-500"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {statusState.error && (
            <p className="text-sm text-red-600">{statusState.error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddStatusModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAddingStatus}>
              {isAddingStatus ? "Adding..." : "Add Status"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

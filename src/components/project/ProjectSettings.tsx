"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { X, Trash2 } from "lucide-react";
import {
  updateProjectAction,
  deleteProjectAction,
  toggleArchiveProjectAction,
  createLabelAction,
  deleteLabelAction,
  createCustomStatusAction,
  deleteCustomStatusAction,
  setWipLimitAction,
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
  color: string | null;
  position: number;
  wipLimit?: number | null;
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
  const [_archiveState, archiveAction, isArchiving] = useActionState(
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
  const [_deleteLabelState, deleteLabelFormAction] = useActionState(
    deleteLabelAction,
    initialState
  );
  const [_deleteStatusState, deleteStatusFormAction] = useActionState(
    deleteCustomStatusAction,
    initialState
  );

  return (
    <div className="space-y-8">
      {/* General Settings */}
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

      {/* Labels */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Labels</h3>
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
            <p className="text-neutral-500">No labels yet</p>
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
                  <form action={deleteLabelFormAction}>
                    <input type="hidden" name="labelId" value={label.id} />
                    <button
                      type="submit"
                      className="text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
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
          <h3 className="text-lg font-semibold text-white">Custom Statuses</h3>
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
          <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-neutral-500" />
            <span className="text-sm font-medium text-neutral-300">
              Backlog
            </span>
            <span className="text-xs text-neutral-500">(default)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-sm font-medium text-neutral-300">
              In Progress
            </span>
            <span className="text-xs text-neutral-500">(default)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-neutral-300">Done</span>
            <span className="text-xs text-neutral-500">(default)</span>
          </div>

          {/* Custom statuses */}
          {project.customStatuses.map((status) => (
            <CustomStatusItem
              key={status.id}
              status={status}
              canEdit={canEdit}
              deleteAction={deleteStatusFormAction}
            />
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      {canEdit && (
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
        </section>
      )}

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
            <label className="block text-sm font-medium text-neutral-400 mb-1">
              Label Name
            </label>
            <Input
              name="name"
              placeholder="e.g., Bug, Feature, Enhancement"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
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
                      ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-white"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {labelState.error && (
            <p className="text-sm text-red-400">{labelState.error}</p>
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
            <label className="block text-sm font-medium text-neutral-400 mb-1">
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
            <label className="block text-sm font-medium text-neutral-400 mb-2">
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
                      ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-white"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {statusState.error && (
            <p className="text-sm text-red-400">{statusState.error}</p>
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

// FR-054: Custom status item with WIP limit editing
function CustomStatusItem({
  status,
  canEdit,
  deleteAction,
}: {
  status: CustomStatus;
  canEdit: boolean;
  deleteAction: (formData: FormData) => void;
}) {
  const [isEditingWip, setIsEditingWip] = useState(false);
  const [wipValue, setWipValue] = useState(status.wipLimit?.toString() ?? "");
  const [_wipState, wipAction, isSettingWip] = useActionState(
    setWipLimitAction,
    { success: false }
  );

  const handleWipSubmit = (formData: FormData) => {
    wipAction(formData);
    setIsEditingWip(false);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
      <div className="flex items-center gap-3">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: status.color ?? "#6b7280" }}
        />
        <span className="text-sm font-medium text-neutral-300">
          {status.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* WIP Limit */}
        {canEdit && (
          <>
            {isEditingWip ? (
              <form
                action={handleWipSubmit}
                className="flex items-center gap-1"
              >
                <input type="hidden" name="statusId" value={status.id} />
                <input
                  type="number"
                  name="wipLimit"
                  min={0}
                  max={50}
                  placeholder="∞"
                  value={wipValue}
                  onChange={(e) => setWipValue(e.target.value)}
                  className="w-14 px-2 py-1 text-xs bg-neutral-700 border border-neutral-600 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsEditingWip(false);
                      setWipValue(status.wipLimit?.toString() ?? "");
                    }
                  }}
                />
                <Button type="submit" size="sm" disabled={isSettingWip}>
                  {isSettingWip ? "..." : "Set"}
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingWip(true)}
                className="text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-400 hover:text-neutral-300 transition-colors"
                title="Set WIP limit"
              >
                WIP: {status.wipLimit ?? "∞"}
              </button>
            )}
          </>
        )}
        {!canEdit && status.wipLimit && (
          <span className="text-xs px-2 py-1 bg-neutral-700 rounded text-neutral-400">
            WIP: {status.wipLimit}
          </span>
        )}
        {/* Delete button */}
        {canEdit && (
          <form action={deleteAction}>
            <input type="hidden" name="statusId" value={status.id} />
            <button
              type="submit"
              className="text-neutral-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

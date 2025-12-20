"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Trash2 } from "lucide-react";
import {
  createCustomStatusAction,
  deleteCustomStatusAction,
  setWipLimitAction,
  ProjectActionResult,
} from "@/lib/actions/project";

interface CustomStatus {
  id: string;
  name: string;
  color: string | null;
  position: number;
  wipLimit?: number | null;
}

interface StatusSettingsProps {
  projectId: string;
  customStatuses: CustomStatus[];
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

export function StatusSettings({ projectId, customStatuses, canEdit }: StatusSettingsProps) {
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newStatusColor, setNewStatusColor] = useState(PRESET_COLORS[4]);

  const [statusState, statusAction, isAddingStatus] = useActionState(
    createCustomStatusAction,
    initialState
  );
  const [_deleteStatusState, deleteStatusFormAction] = useActionState(
    deleteCustomStatusAction,
    initialState
  );

  return (
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
        {customStatuses.map((status) => (
          <CustomStatusItem
            key={status.id}
            status={status}
            canEdit={canEdit}
            deleteAction={deleteStatusFormAction}
          />
        ))}
      </div>

      {/* Add Custom Status Modal */}
      <Modal
        isOpen={showAddStatusModal}
        onClose={() => setShowAddStatusModal(false)}
        title="Add Custom Status"
      >
        <form action={statusAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
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
    </section>
  );
}

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

"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";
import {
  createLabelAction,
  deleteLabelAction,
  ProjectActionResult,
} from "@/lib/actions/project";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelSettingsProps {
  projectId: string;
  labels: Label[];
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

export function LabelSettings({ projectId, labels, canEdit }: LabelSettingsProps) {
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  const [labelState, labelAction, isAddingLabel] = useActionState(
    createLabelAction,
    initialState
  );
  const [_deleteLabelState, deleteLabelFormAction] = useActionState(
    deleteLabelAction,
    initialState
  );

  return (
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
        {labels.length === 0 ? (
          <p className="text-neutral-500">No labels yet</p>
        ) : (
          labels.map((label) => (
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

      {/* Add Label Modal */}
      <Modal
        isOpen={showAddLabelModal}
        onClose={() => setShowAddLabelModal(false)}
        title="Add Label"
      >
        <form action={labelAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
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
    </section>
  );
}

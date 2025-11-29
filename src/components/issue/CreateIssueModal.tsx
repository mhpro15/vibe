"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createIssueAction, IssueActionResult } from "@/lib/actions/issue";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  image?: string | null;
}

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  labels: Label[];
  teamMembers: TeamMember[];
}

const initialState: IssueActionResult = {
  success: false,
};

export function CreateIssueModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  labels,
  teamMembers,
}: CreateIssueModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(
    createIssueAction,
    initialState
  );

  useEffect(() => {
    if (state.success && state.data?.issueId) {
      formRef.current?.reset();
      onClose();
      router.push(`/projects/${projectId}/issues/${state.data.issueId}`);
    }
  }, [state.success, state.data?.issueId, onClose, projectId, router]);

  const handleClose = () => {
    setSelectedLabels([]);
    onClose();
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Issue">
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        {selectedLabels.map((id) => (
          <input key={id} type="hidden" name="labelIds" value={id} />
        ))}

        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1">
            Project
          </label>
          <div className="px-3 py-2 bg-neutral-800 rounded-lg text-neutral-400 border border-neutral-700/50">
            {projectName}
          </div>
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-neutral-400 mb-1"
          >
            Title
          </label>
          <Input
            id="title"
            name="title"
            placeholder="What needs to be done?"
            maxLength={200}
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-neutral-400 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={5000}
            placeholder="Add more details..."
            className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-neutral-400 mb-1"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="assigneeId"
              className="block text-sm font-medium text-neutral-400 mb-1"
            >
              Assignee
            </label>
            <select
              id="assigneeId"
              name="assigneeId"
              defaultValue=""
              className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-neutral-400 mb-1"
          >
            Due Date (optional)
          </label>
          <Input id="dueDate" name="dueDate" type="date" className="" />
        </div>

        {labels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedLabels.includes(label.id)
                      ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-white"
                      : ""
                  }`}
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                  }}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">
              {state.error}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Issue"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

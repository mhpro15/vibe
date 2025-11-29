"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createProjectAction,
  ProjectActionResult,
} from "@/lib/actions/project";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
}

const initialState: ProjectActionResult = {
  success: false,
};

export function CreateProjectModal({
  isOpen,
  onClose,
  teamId,
  teamName,
}: CreateProjectModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialState
  );

  useEffect(() => {
    if (state.success && state.data?.projectId) {
      formRef.current?.reset();
      onClose();
      router.push(`/projects/${state.data.projectId}`);
    }
  }, [state.success, state.data?.projectId, onClose, router]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="teamId" value={teamId} />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Team
          </label>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
            {teamName}
          </div>
        </div>

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
            placeholder="Enter project name"
            maxLength={100}
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            1-100 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            placeholder="Describe your project..."
            className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max 2000 characters
          </p>
        </div>

        {state.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

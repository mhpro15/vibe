"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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

interface CreateIssueFormProps {
  projectId: string;
  projectName: string;
  labels: Label[];
  teamMembers: TeamMember[];
}

const initialState: IssueActionResult = {
  success: false,
};

export function CreateIssueForm({
  projectId,
  projectName,
  labels,
  teamMembers,
}: CreateIssueFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(
    createIssueAction,
    initialState
  );

  useEffect(() => {
    if (state.success && state.data?.issueId) {
      router.push(`/projects/${projectId}/issues/${state.data.issueId}`);
    }
  }, [state.success, state.data?.issueId, projectId, router]);

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />
      <input
        type="hidden"
        name="labelIds"
        value={selectedLabels.join(",")}
      />

      {/* Project indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-neutral-700 to-neutral-800 border border-neutral-600/50 flex items-center justify-center text-white font-bold">
            {projectName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Creating issue in
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {projectName}
            </p>
          </div>
        </div>
      </div>

      {/* Main form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            name="title"
            placeholder="What needs to be done?"
            maxLength={200}
            required
            className="text-lg"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max 200 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            maxLength={5000}
            placeholder="Add more details about this issue..."
            className="w-full px-4 py-3 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max 5000 characters
          </p>
        </div>

        {/* Priority & Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all"
            >
              <option value="HIGH">🔴 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">⚪ Low</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="assigneeId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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

        {/* Due Date */}
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            className="w-full md:w-auto px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all"
          />
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`transition-all ${
                    selectedLabels.includes(label.id)
                      ? "ring-2 ring-white/50 ring-offset-2 ring-offset-neutral-900"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Badge color={label.color}>{label.name}</Badge>
                </button>
              ))}
            </div>
            {selectedLabels.length > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {selectedLabels.length} label(s) selected
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {state.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link href={`/projects/${projectId}`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Issue"}
        </Button>
      </div>
    </form>
  );
}

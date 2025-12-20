"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Pencil } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueDate: Date | null;
}

interface IssueDescriptionProps {
  issue: Issue;
  isUpdating: boolean;
  updateAction: (formData: FormData) => void;
  updateState: { success: boolean; error?: string };
}

export function IssueDescription({
  issue,
  isUpdating,
  updateAction,
  updateState,
}: IssueDescriptionProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(
    issue.description || ""
  );
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  useEffect(() => {
    if (updateState.success) {
      setIsEditingDescription(false);
    }
  }, [updateState.success]);

  return (
    <div className="mt-3 md:mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs md:text-sm font-medium text-neutral-400">
          Description
        </h3>
        {!isEditingDescription && (
          <button
            onClick={() => setIsEditingDescription(true)}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white transition-colors"
            title="Edit description"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      {isEditingDescription ? (
        <form action={updateAction} className="space-y-2">
          <input type="hidden" name="issueId" value={issue.id} />
          <input type="hidden" name="title" value={issue.title} />
          <input type="hidden" name="priority" value={issue.priority} />
          <input
            type="hidden"
            name="dueDate"
            value={issue.dueDate?.toString() || ""}
          />
          <textarea
            ref={descriptionInputRef}
            name="description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={4}
            maxLength={5000}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            placeholder="Add a description..."
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditingDescription(false);
                setEditDescription(issue.description || "");
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      ) : issue.description ? (
        <p className="text-sm md:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
          {issue.description}
        </p>
      ) : (
        <button
          onClick={() => setIsEditingDescription(true)}
          className="text-sm text-neutral-500 hover:text-neutral-400 italic transition-colors"
        >
          Click to add a description...
        </button>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Pencil, X } from "lucide-react";
import { IssueActionResult } from "@/lib/actions/issue";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  description: string | null;
  dueDate: Date | null;
  labels: Label[];
}

interface IssueHeaderProps {
  issue: Issue;
  statusOptions: Array<{ value: string; label: string; color: string }>;
  priorityOptions: Array<{
    value: string;
    label: string;
    color: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
  }>;
  isDeleting: boolean;
  isUpdating: boolean;
  deleteAction: (formData: FormData) => void;
  updateAction: (formData: FormData) => void;
  updateState: IssueActionResult;
}

export function IssueHeader({
  issue,
  statusOptions,
  priorityOptions,
  isDeleting,
  isUpdating,
  deleteAction,
  updateAction,
  updateState,
}: IssueHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(issue.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (updateState.success) {
      setIsEditingTitle(false);
    }
  }, [updateState.success]);

  const handleUpdateTitle = async (formData: FormData) => {
    await updateAction(formData);
  };

  return (
    <div className="bg-neutral-900 rounded-lg md:rounded-xl border border-neutral-700/50 p-3 md:p-4 lg:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                statusOptions.find((s) => s.value === issue.status)?.color
              } text-white shrink-0`}
            >
              {statusOptions.find((s) => s.value === issue.status)?.label}
            </span>
            {(() => {
              const priorityOption = priorityOptions.find(
                (p) => p.value === issue.priority
              );
              return (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityOption?.color} ${priorityOption?.textColor} ${priorityOption?.borderColor} shrink-0`}
                >
                  {priorityOption?.label}
                </span>
              );
            })()}
          </div>
          <form action={deleteAction}>
            <input type="hidden" name="issueId" value={issue.id} />
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isDeleting}
              className="shrink-0"
            >
              {isDeleting ? "..." : "Delete"}
            </Button>
          </form>
        </div>

        {isEditingTitle ? (
          <form action={handleUpdateTitle} className="flex flex-col gap-2">
            <input type="hidden" name="issueId" value={issue.id} />
            <input
              type="hidden"
              name="description"
              value={issue.description || ""}
            />
            <input type="hidden" name="priority" value={issue.priority} />
            <input
              type="hidden"
              name="dueDate"
              value={issue.dueDate?.toString() || ""}
            />
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg md:text-xl lg:text-2xl font-bold bg-neutral-800 border border-neutral-600 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              maxLength={200}
            />
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isUpdating || !editTitle.trim()}
              >
                {isUpdating ? "..." : "Save"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditTitle(issue.title);
                }}
                className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="group flex items-start gap-2">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white wrap-break-word flex-1">
              {issue.title}
            </h1>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all shrink-0"
              title="Edit title"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {updateState.error && (
          <p className="text-sm text-red-400">{updateState.error}</p>
        )}
      </div>
    </div>
  );
}

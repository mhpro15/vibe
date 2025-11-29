"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Avatar } from "@/components/ui/Avatar";
import { changeStatusAction } from "@/lib/actions/issue";
import { ExternalLink } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Subtask {
  id: string;
  isCompleted: boolean;
}

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  position: number;
  dueDate: Date | null;
  projectId: string;
  assignee: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  labels: Label[];
  subtasks: Subtask[];
}

interface CustomStatus {
  id: string;
  name: string;
  color: string | null;
  position: number;
  wipLimit?: number | null;
}

interface KanbanBoardProps {
  projectId: string;
  issues: Issue[];
  customStatuses: CustomStatus[];
}

type ColumnId =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED"
  | string;

interface Column {
  id: ColumnId;
  title: string;
  color: string;
  wipLimit?: number | null;
  isCustom: boolean;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "BACKLOG", title: "Backlog", color: "#6b7280", isCustom: false },
  { id: "TODO", title: "To Do", color: "#3b82f6", isCustom: false },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    color: "#8b5cf6",
    isCustom: false,
  },
  { id: "IN_REVIEW", title: "In Review", color: "#f59e0b", isCustom: false },
  { id: "DONE", title: "Done", color: "#22c55e", isCustom: false },
  { id: "CANCELLED", title: "Cancelled", color: "#9ca3af", isCustom: false },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-400",
};

export function KanbanBoard({
  projectId,
  issues: initialIssues,
  customStatuses,
}: KanbanBoardProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [, startTransition] = useTransition();

  // Build columns including custom statuses
  const columns: Column[] = [
    ...DEFAULT_COLUMNS,
    ...customStatuses.map((cs) => ({
      id: cs.id,
      title: cs.name,
      color: cs.color ?? "#6b7280",
      wipLimit: cs.wipLimit,
      isCustom: true,
    })),
  ];

  // Group issues by status
  const getIssuesByStatus = (statusId: ColumnId): Issue[] => {
    return issues
      .filter((issue) => issue.status === statusId)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedIssue = issues.find((i) => i.id === draggableId);
    if (!draggedIssue) return;

    // Calculate new positions for all affected issues
    const sourceColumnIssues = getIssuesByStatus(
      source.droppableId as ColumnId
    );
    const destColumnIssues =
      source.droppableId === destination.droppableId
        ? sourceColumnIssues
        : getIssuesByStatus(destination.droppableId as ColumnId);

    // Remove from source
    const sourceFiltered = sourceColumnIssues.filter(
      (i) => i.id !== draggableId
    );

    // Insert at destination
    const destWithInsert =
      source.droppableId === destination.droppableId
        ? [
            ...sourceFiltered.slice(0, destination.index),
            draggedIssue,
            ...sourceFiltered.slice(destination.index),
          ]
        : [
            ...destColumnIssues.slice(0, destination.index),
            draggedIssue,
            ...destColumnIssues.slice(destination.index),
          ];

    // Optimistically update UI with new positions
    const updatedIssues = issues.map((issue) => {
      if (issue.id === draggableId) {
        return {
          ...issue,
          status: destination.droppableId,
          position: destination.index,
        };
      }
      // Update positions for issues in destination column
      const destIdx = destWithInsert.findIndex((i) => i.id === issue.id);
      if (destIdx !== -1) {
        return { ...issue, position: destIdx };
      }
      // Update positions for issues in source column (if different from dest)
      if (source.droppableId !== destination.droppableId) {
        const srcIdx = sourceFiltered.findIndex((i) => i.id === issue.id);
        if (srcIdx !== -1) {
          return { ...issue, position: srcIdx };
        }
      }
      return issue;
    });
    setIssues(updatedIssues);

    // Update on server
    startTransition(async () => {
      const formData = new FormData();
      formData.append("issueId", draggableId);
      formData.append("status", destination.droppableId);
      formData.append("position", destination.index.toString());

      const result = await changeStatusAction({ success: false }, formData);

      if (!result.success) {
        // Revert on error
        setIssues(issues);
        console.error("Failed to update status:", result.error);
      }
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[400px]">
        {columns.map((column) => {
          const columnIssues = getIssuesByStatus(column.id);
          const isOverLimit =
            column.wipLimit && columnIssues.length > column.wipLimit;

          return (
            <div
              key={column.id}
              className="shrink-0 w-56 rounded-xl border border-neutral-700/50 bg-neutral-900/50"
            >
              {/* Column Header */}
              <div
                className={`p-2.5 border-b border-neutral-700/50 rounded-t-xl ${
                  isOverLimit ? "bg-red-900/20" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: column.color }}
                    />
                    <h3 className="font-medium text-white text-sm truncate">
                      {column.title}
                    </h3>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                        isOverLimit
                          ? "bg-red-500/20 text-red-400"
                          : "bg-neutral-700 text-neutral-300"
                      }`}
                    >
                      {columnIssues.length}
                      {column.wipLimit && `/${column.wipLimit}`}
                    </span>
                  </div>
                </div>
                {isOverLimit && (
                  <p className="text-xs text-red-400 mt-1">
                    WIP limit exceeded
                  </p>
                )}
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-1.5 min-h-[150px] max-h-[calc(100vh-320px)] overflow-y-auto space-y-1.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-neutral-800/50" : ""
                    }`}
                  >
                    {columnIssues.map((issue, index) => (
                      <Draggable
                        key={issue.id}
                        draggableId={issue.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                          >
                            <IssueCard
                              issue={issue}
                              projectId={projectId}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnIssues.length === 0 && !snapshot.isDraggingOver && (
                      <div className="py-8 text-center text-neutral-500 text-sm">
                        No issues
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

interface IssueCardProps {
  issue: Issue;
  projectId: string;
  isDragging: boolean;
}

function IssueCard({ issue, projectId, isDragging }: IssueCardProps) {
  const router = useRouter();
  const completedSubtasks = issue.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = issue.subtasks.length;
  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();

  const handleOpenIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/projects/${projectId}/issues/${issue.id}?tab=board`);
  };

  return (
    <div
      onDoubleClick={handleOpenIssue}
      className={`group p-2.5 bg-neutral-800 rounded-lg border border-neutral-700/50 cursor-grab active:cursor-grabbing transition-all hover:border-neutral-600 ${
        isDragging ? "shadow-lg ring-2 ring-violet-500/50" : ""
      }`}
    >
      {/* Priority indicator and open button */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <span className="text-xs font-medium text-white line-clamp-2 flex-1">
          {issue.title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleOpenIssue}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-700 text-neutral-400 hover:text-violet-400 transition-all"
            title="Open issue"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              PRIORITY_COLORS[issue.priority]
            }`}
            title={issue.priority}
          />
        </div>
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-1.5">
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[70px]"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
          {issue.labels.length > 2 && (
            <span className="text-[10px] text-neutral-400">
              +{issue.labels.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400">
        <div className="flex items-center gap-2">
          {/* Due date */}
          {issue.dueDate && (
            <span
              className={`flex items-center gap-1 ${
                isOverdue ? "text-red-400" : ""
              }`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(issue.dueDate).toLocaleDateString()}
            </span>
          )}

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <span className="flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
        </div>

        {/* Assignee */}
        {issue.assignee && (
          <Avatar
            src={issue.assignee.image}
            name={issue.assignee.name}
            size="xs"
          />
        )}
      </div>
    </div>
  );
}

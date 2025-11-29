"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Avatar } from "@/components/ui/Avatar";
import { changeStatusAction } from "@/lib/actions/issue";

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

type ColumnId = "BACKLOG" | "IN_PROGRESS" | "DONE" | string;

interface Column {
  id: ColumnId;
  title: string;
  color: string;
  wipLimit?: number | null;
  isCustom: boolean;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "BACKLOG", title: "Backlog", color: "#6b7280", isCustom: false },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    color: "#8b5cf6",
    isCustom: false,
  },
  { id: "DONE", title: "Done", color: "#22c55e", isCustom: false },
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

    // Optimistically update UI
    const newIssues = issues.map((issue) =>
      issue.id === draggableId
        ? {
            ...issue,
            status: destination.droppableId,
            position: destination.index,
          }
        : issue
    );
    setIssues(newIssues);

    // Update on server
    startTransition(async () => {
      const formData = new FormData();
      formData.append("issueId", draggableId);
      formData.append("status", destination.droppableId);

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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnIssues = getIssuesByStatus(column.id);
          const isOverLimit =
            column.wipLimit && columnIssues.length > column.wipLimit;

          return (
            <div
              key={column.id}
              className="shrink-0 w-80 rounded-xl border border-neutral-700/50 bg-neutral-900/50"
            >
              {/* Column Header */}
              <div
                className={`p-3 border-b border-neutral-700/50 rounded-t-xl ${
                  isOverLimit ? "bg-red-900/20" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    <h3 className="font-medium text-white">{column.title}</h3>
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full ${
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
                    className={`p-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto space-y-2 transition-colors ${
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
  const completedSubtasks = issue.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = issue.subtasks.length;
  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();

  return (
    <div
      className={`p-3 bg-neutral-800 rounded-lg border border-neutral-700/50 cursor-grab active:cursor-grabbing transition-all hover:border-neutral-600 ${
        isDragging ? "shadow-lg ring-2 ring-violet-500/50" : ""
      }`}
    >
      {/* Priority indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/projects/${projectId}/issues/${issue.id}`}
          className="text-sm font-medium text-white hover:text-violet-400 transition-colors line-clamp-2"
          onClick={(e) => e.stopPropagation()}
        >
          {issue.title}
        </Link>
        <span
          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
            PRIORITY_COLORS[issue.priority]
          }`}
          title={issue.priority}
        />
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-neutral-400">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
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

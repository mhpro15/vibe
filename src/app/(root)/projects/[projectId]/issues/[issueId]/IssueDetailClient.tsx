"use client";

import {
  useActionState,
  useOptimistic,
} from "react";
import { Badge } from "@/components/ui/Badge";
import {
  SubtasksList,
  IssueHeader,
  IssueDescription,
  IssueSidebar,
  IssueCommentsSection,
} from "@/components/issue";
import {
  deleteIssueAction,
  changeStatusAction,
  addCommentAction,
  updateIssueAction,
  IssueActionResult,
} from "@/lib/actions/issue";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  aiSummary?: string | null;
  aiSuggestion?: string | null;
  project: {
    id: string;
    name: string;
    teamId: string;
  };
  creator: {
    id: string;
    name: string;
    image?: string | null;
  };
  assignee: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  labels: Label[];
  comments: Comment[];
}

interface IssueDetailClientProps {
  issue: Issue;
  currentUserId: string;
  teamMembers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }>;
  subtasks: Subtask[];
}

const initialState: IssueActionResult = {
  success: false,
};

const statusOptions = [
  { value: "BACKLOG", label: "Backlog", color: "bg-neutral-500" },
  { value: "TODO", label: "To Do", color: "bg-blue-500" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-violet-500" },
  { value: "IN_REVIEW", label: "In Review", color: "bg-amber-500" },
  { value: "DONE", label: "Done", color: "bg-emerald-500" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-neutral-600" },
];

const priorityOptions = [
  {
    value: "LOW",
    label: "Low",
    color: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    color: "bg-amber-500/20",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  {
    value: "HIGH",
    label: "High",
    color: "bg-orange-500/20",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    dotColor: "bg-orange-500",
  },
];

export function IssueDetailClient({
  issue: initialIssue,
  currentUserId,
  teamMembers,
  subtasks,
}: IssueDetailClientProps) {
  const [issue, addOptimisticIssue] = useOptimistic(
    initialIssue,
    (
      state,
      update: Partial<Issue> | { type: "add_comment"; comment: Comment }
    ) => {
      if ("type" in update && update.type === "add_comment") {
        return {
          ...state,
          comments: [...state.comments, update.comment],
        };
      }
      return { ...state, ...(update as Partial<Issue>) };
    }
  );

  const [, deleteAction, isDeleting] = useActionState(
    deleteIssueAction,
    initialState
  );
  const [, statusAction, isChangingStatus] = useActionState(
    changeStatusAction,
    initialState
  );
  const [commentState, commentAction, isAddingComment] = useActionState(
    addCommentAction,
    initialState
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updateIssueAction,
    initialState
  );

  const handleStatusChange = async (formData: FormData) => {
    const newStatus = formData.get("status") as string;
    addOptimisticIssue({ status: newStatus });
    await statusAction(formData);
  };

  const handleAddComment = async (formData: FormData) => {
    const content = formData.get("content") as string;
    const currentUser = teamMembers.find((m) => m.id === currentUserId);

    const tempComment: Comment = {
      id: Math.random().toString(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUser?.name || "You",
        image: currentUser?.image,
      },
    };

    addOptimisticIssue({ type: "add_comment", comment: tempComment });
    await commentAction(formData);
  };

  const handleUpdateIssue = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dueDate = formData.get("dueDate") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const priority = formData.get("priority") as string;

    const update: Partial<Issue> = {};
    if (title) update.title = title;
    if (description !== null) update.description = description;
    if (dueDate !== null) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== null) {
      const assignee = teamMembers.find((m) => m.id === assigneeId);
      update.assignee = assignee
        ? { id: assignee.id, name: assignee.name || "", image: assignee.image }
        : null;
    }
    if (priority) update.priority = priority;

    addOptimisticIssue(update);
    await updateAction(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-3 md:space-y-4">
        <IssueHeader
          issue={issue}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          isDeleting={isDeleting}
          isUpdating={isUpdating}
          deleteAction={deleteAction}
          updateAction={handleUpdateIssue}
          updateState={updateState}
        />

        <div className="bg-neutral-900 rounded-lg md:rounded-xl border border-neutral-700/50 p-3 md:p-4 lg:p-5">
          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {issue.labels.map((label) => (
                <Badge key={label.id} color={label.color}>
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          <IssueDescription
            issue={issue}
            isUpdating={isUpdating}
            updateAction={handleUpdateIssue}
            updateState={updateState}
          />
        </div>

        {/* Subtasks */}
        <SubtasksList issueId={issue.id} subtasks={subtasks} />

        {/* Comments */}
        <IssueCommentsSection
          issueId={issue.id}
          comments={issue.comments}
          currentUserId={currentUserId}
          isAddingComment={isAddingComment}
          commentAction={handleAddComment}
          commentState={commentState}
        />
      </div>

      {/* Sidebar - Mobile: Horizontal cards, Desktop: Vertical stack */}
      <IssueSidebar
        issue={issue}
        teamMembers={teamMembers}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        isChangingStatus={isChangingStatus}
        isUpdating={isUpdating}
        handleStatusChange={handleStatusChange}
        handleUpdateIssue={handleUpdateIssue}
      />
    </div>
  );
}

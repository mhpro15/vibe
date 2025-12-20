"use client";

import {
  useState,
  useRef,
  useEffect,
  useActionState,
  useOptimistic,
} from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CommentList, AIFeatures, SubtasksList } from "@/components/issue";
import {
  deleteIssueAction,
  changeStatusAction,
  addCommentAction,
  updateIssueAction,
  IssueActionResult,
} from "@/lib/actions/issue";
import {
  Check,
  Calendar,
  User,
  Clock,
  Pencil,
  X,
  ChevronDown,
} from "lucide-react";

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

  // Editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState(issue.title);
  const [editDescription, setEditDescription] = useState(
    issue.description || ""
  );

  // Sidebar editing states
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [editDueDate, setEditDueDate] = useState(
    issue.dueDate ? issue.dueDate.toISOString().split("T")[0] : ""
  );

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);

  // Form refs for programmatic submission
  const priorityFormRef = useRef<HTMLFormElement>(null);
  const assigneeFormRef = useRef<HTMLFormElement>(null);

  // Selected values for the hidden forms
  const [selectedPriority, setSelectedPriority] = useState(issue.priority);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(
    issue.assignee?.id || ""
  );

  // Handle priority selection
  const handlePrioritySelect = (priority: string) => {
    setSelectedPriority(priority);
    setIsPriorityDropdownOpen(false);
    // Submit form after state update and dropdown close
    setTimeout(() => {
      priorityFormRef.current?.requestSubmit();
    }, 0);
  };

  // Handle assignee selection
  const handleAssigneeSelect = (assigneeId: string) => {
    setSelectedAssigneeId(assigneeId);
    setIsAssigneeDropdownOpen(false);
    // Submit form after state update and dropdown close
    setTimeout(() => {
      assigneeFormRef.current?.requestSubmit();
    }, 0);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPriorityDropdownOpen(false);
      }
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  // Reset editing state on successful update
  useEffect(() => {
    if (updateState.success) {
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  }, [updateState.success]);

  // Generate a stable key based on comment count
  const formKey = `comment-form-${issue.comments.length}`;

  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== "DONE";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
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
                      className={`px-2 py-1 rounded text-xs font-medium border ${priorityOption?.color} ${priorityOption?.textColor} ${priorityOption?.borderColor} shrink-0`}
                    >
                      {priorityOption?.label} Priority
                    </span>
                  );
                })()}
              </div>

              {/* Editable Title */}
              {isEditingTitle ? (
                <form
                  action={handleUpdateIssue}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
                >
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
                    className="w-full sm:flex-1 text-2xl font-bold bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    maxLength={200}
                  />
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
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
                  <h1 className="text-2xl font-bold text-white break-words">
                    {issue.title}
                  </h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all shrink-0 mt-1"
                    title="Edit title"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}

              {updateState.error && (
                <p className="text-sm text-red-400 mt-1">{updateState.error}</p>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <form action={deleteAction}>
                <input type="hidden" name="issueId" value={issue.id} />
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isDeleting}
                >
                  {isDeleting ? "..." : "Delete"}
                </Button>
              </form>
            </div>
          </div>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {issue.labels.map((label) => (
                <Badge key={label.id} color={label.color}>
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-neutral-400">
                Description
              </h3>
              {!isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-white transition-colors"
                  title="Edit description"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <form action={handleUpdateIssue} className="space-y-3">
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
                  rows={6}
                  maxLength={5000}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  placeholder="Add a description..."
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingDescription(false);
                      setEditDescription(issue.description || "");
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <Button type="submit" size="sm" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            ) : issue.description ? (
              <p className="text-neutral-300 whitespace-pre-wrap">
                {issue.description}
              </p>
            ) : (
              <button
                onClick={() => setIsEditingDescription(true)}
                className="text-neutral-500 hover:text-neutral-400 italic transition-colors"
              >
                Click to add a description...
              </button>
            )}
          </div>
        </div>

        {/* Subtasks */}
        <SubtasksList issueId={issue.id} subtasks={subtasks} />

        {/* Comments */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Comments ({issue.comments.length})
          </h3>

          <CommentList
            comments={issue.comments}
            currentUserId={currentUserId}
          />

          {/* Add comment form */}
          <form
            key={formKey}
            action={handleAddComment}
            className="mt-6 pt-6 border-t border-neutral-700/50"
          >
            <input type="hidden" name="issueId" value={issue.id} />
            <textarea
              name="content"
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all"
            />
            {commentState.error && (
              <p className="text-sm text-red-600 mt-1">{commentState.error}</p>
            )}
            <div className="flex justify-end mt-2">
              <Button type="submit" disabled={isAddingComment}>
                {isAddingComment ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Status */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Status</h3>
          <div className="space-y-2">
            {statusOptions.map((status) => (
              <form key={status.value} action={handleStatusChange}>
                <input type="hidden" name="issueId" value={issue.id} />
                <input type="hidden" name="status" value={status.value} />
                <button
                  type="submit"
                  disabled={isChangingStatus || issue.status === status.value}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-transparent ${
                    issue.status === status.value
                      ? "bg-neutral-800! border border-neutral-600"
                      : "hover:bg-neutral-800"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="text-sm text-neutral-300">
                    {status.label}
                  </span>
                  {issue.status === status.value && (
                    <Check className="w-4 h-4 text-violet-400 ml-auto" />
                  )}
                </button>
              </form>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Details</h3>
          <div className="space-y-4">
            {/* Priority */}
            <div ref={priorityDropdownRef} className="relative">
              {/* Hidden form for priority updates */}
              <form
                ref={priorityFormRef}
                action={handleUpdateIssue}
                className="hidden"
              >
                <input type="hidden" name="issueId" value={issue.id} />
                <input type="hidden" name="title" value={issue.title} />
                <input
                  type="hidden"
                  name="description"
                  value={issue.description || ""}
                />
                <input type="hidden" name="priority" value={selectedPriority} />
                <input
                  type="hidden"
                  name="dueDate"
                  value={issue.dueDate?.toISOString() || ""}
                />
                <input
                  type="hidden"
                  name="assigneeId"
                  value={issue.assignee?.id || ""}
                />
              </form>

              <span className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
                Priority
              </span>
              <button
                type="button"
                onClick={() =>
                  setIsPriorityDropdownOpen(!isPriorityDropdownOpen)
                }
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      priorityOptions.find((p) => p.value === issue.priority)
                        ?.dotColor || "bg-neutral-500"
                    }`}
                  />
                  <span className="text-sm text-white">
                    {priorityOptions.find((p) => p.value === issue.priority)
                      ?.label || issue.priority}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform ${
                    isPriorityDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isPriorityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 overflow-hidden">
                  {priorityOptions.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => handlePrioritySelect(priority.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-700 transition-colors text-left ${
                        issue.priority === priority.value
                          ? "bg-neutral-700"
                          : ""
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${priority.dotColor}`}
                      />
                      <span className="text-sm text-white">
                        {priority.label}
                      </span>
                      {issue.priority === priority.value && (
                        <Check className="w-4 h-4 text-violet-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assignee */}
            <div ref={assigneeDropdownRef} className="relative">
              {/* Hidden form for assignee updates */}
              <form
                ref={assigneeFormRef}
                action={handleUpdateIssue}
                className="hidden"
              >
                <input type="hidden" name="issueId" value={issue.id} />
                <input type="hidden" name="title" value={issue.title} />
                <input
                  type="hidden"
                  name="description"
                  value={issue.description || ""}
                />
                <input type="hidden" name="priority" value={issue.priority} />
                <input
                  type="hidden"
                  name="dueDate"
                  value={issue.dueDate?.toISOString() || ""}
                />
                <input
                  type="hidden"
                  name="assigneeId"
                  value={selectedAssigneeId}
                />
              </form>

              <span className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
                <User className="w-3 h-3" />
                Assignee
              </span>
              <button
                type="button"
                onClick={() =>
                  setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)
                }
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
              >
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={issue.assignee.image}
                      name={issue.assignee.name}
                      size="sm"
                    />
                    <span className="text-sm text-white">
                      {issue.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-neutral-500">Unassigned</span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform ${
                    isAssigneeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isAssigneeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 overflow-hidden max-h-64 overflow-y-auto">
                  {/* Unassign option */}
                  <button
                    type="button"
                    onClick={() => handleAssigneeSelect("")}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-700 transition-colors text-left ${
                      !issue.assignee ? "bg-neutral-700" : ""
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center">
                      <User className="w-3 h-3 text-neutral-400" />
                    </div>
                    <span className="text-sm text-neutral-400">Unassigned</span>
                    {!issue.assignee && (
                      <Check className="w-4 h-4 text-violet-400 ml-auto" />
                    )}
                  </button>
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAssigneeSelect(member.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-700 transition-colors text-left ${
                        issue.assignee?.id === member.id ? "bg-neutral-700" : ""
                      }`}
                    >
                      <Avatar
                        src={member.image}
                        name={member.name || ""}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {member.name || "Unknown"}
                        </p>
                        {member.email && (
                          <p className="text-xs text-neutral-500 truncate">
                            {member.email}
                          </p>
                        )}
                      </div>
                      {issue.assignee?.id === member.id && (
                        <Check className="w-4 h-4 text-violet-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <span className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                Due Date
              </span>
              {isEditingDueDate ? (
                <form action={handleUpdateIssue} className="space-y-2">
                  <input type="hidden" name="issueId" value={issue.id} />
                  <input type="hidden" name="title" value={issue.title} />
                  <input
                    type="hidden"
                    name="description"
                    value={issue.description || ""}
                  />
                  <input type="hidden" name="priority" value={issue.priority} />
                  <input
                    type="hidden"
                    name="assigneeId"
                    value={issue.assignee?.id || ""}
                  />
                  <input
                    ref={dueDateInputRef}
                    type="date"
                    name="dueDate"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDueDate(false);
                        setEditDueDate(
                          issue.dueDate
                            ? issue.dueDate.toISOString().split("T")[0]
                            : ""
                        );
                      }}
                      className="px-2 py-1 text-xs rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <Button type="submit" size="sm" disabled={isUpdating}>
                      {isUpdating ? "..." : "Save"}
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDueDate(true);
                    setTimeout(() => dueDateInputRef.current?.focus(), 0);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors text-left ${
                    isOverdue ? "text-red-400" : ""
                  }`}
                >
                  <span
                    className={`text-sm ${
                      issue.dueDate
                        ? isOverdue
                          ? "text-red-400"
                          : "text-white"
                        : "text-neutral-500"
                    }`}
                  >
                    {issue.dueDate
                      ? `${new Date(issue.dueDate).toLocaleDateString()}${
                          isOverdue ? " (Overdue)" : ""
                        }`
                      : "Set due date"}
                  </span>
                  <Pencil className="w-3 h-3 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Created */}
            <div>
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created by
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Avatar
                  src={issue.creator.image}
                  name={issue.creator.name}
                  size="sm"
                />
                <span className="text-sm text-white">{issue.creator.name}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {new Date(issue.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* AI Features */}
        <AIFeatures
          issueId={issue.id}
          descriptionLength={issue.description?.length || 0}
          commentCount={issue.comments.length}
          cachedSummary={issue.aiSummary}
          cachedSuggestion={issue.aiSuggestion}
        />
      </div>
    </div>
  );
}

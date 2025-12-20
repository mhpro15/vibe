"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Check,
  Calendar,
  User,
  Clock,
  Pencil,
  ChevronDown,
} from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  assignee: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  creator: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface IssueSidebarProps {
  issue: Issue;
  teamMembers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }>;
  statusOptions: Array<{ value: string; label: string; color: string }>;
  priorityOptions: Array<{
    value: string;
    label: string;
    color: string;
    dotColor: string;
  }>;
  isChangingStatus: boolean;
  isUpdating: boolean;
  handleStatusChange: (formData: FormData) => void;
  handleUpdateIssue: (formData: FormData) => void;
}

export function IssueSidebar({
  issue,
  teamMembers,
  statusOptions,
  priorityOptions,
  isChangingStatus,
  isUpdating,
  handleStatusChange,
  handleUpdateIssue,
}: IssueSidebarProps) {
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [editDueDate, setEditDueDate] = useState(
    issue.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : ""
  );

  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const priorityFormRef = useRef<HTMLFormElement>(null);
  const assigneeFormRef = useRef<HTMLFormElement>(null);

  const [selectedPriority, setSelectedPriority] = useState(issue.priority);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(
    issue.assignee?.id || ""
  );

  const handlePrioritySelect = (priority: string) => {
    setSelectedPriority(priority);
    setIsPriorityDropdownOpen(false);
    setTimeout(() => {
      priorityFormRef.current?.requestSubmit();
    }, 0);
  };

  const handleAssigneeSelect = (assigneeId: string) => {
    setSelectedAssigneeId(assigneeId);
    setIsAssigneeDropdownOpen(false);
    setTimeout(() => {
      assigneeFormRef.current?.requestSubmit();
    }, 0);
  };

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

  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== "DONE";

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Status */}
      <div className="bg-neutral-900 rounded-lg md:rounded-xl border border-neutral-700/50 p-3 md:p-4">
        <h3 className="text-xs md:text-sm font-medium text-neutral-400 mb-2">
          Status
        </h3>
        <div className="space-y-1.5 md:space-y-2">
          {statusOptions.map((status) => (
            <form key={status.value} action={handleStatusChange}>
              <input type="hidden" name="issueId" value={issue.id} />
              <input type="hidden" name="status" value={status.value} />
              <button
                type="submit"
                disabled={isChangingStatus || issue.status === status.value}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg transition-colors bg-transparent text-left ${
                  issue.status === status.value
                    ? "bg-neutral-800! border border-neutral-600"
                    : "hover:bg-neutral-800"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${status.color}`}
                />
                <span className="text-xs md:text-sm text-neutral-300">
                  {status.label}
                </span>
                {issue.status === status.value && (
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400 ml-auto" />
                )}
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="bg-neutral-900 rounded-lg md:rounded-xl border border-neutral-700/50 p-3 md:p-4">
        <h3 className="text-xs md:text-sm font-medium text-neutral-400 mb-2">
          Details
        </h3>
        <div className="space-y-3">
          {/* Priority */}
          <div ref={priorityDropdownRef} className="relative">
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

            <label className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
              Priority
            </label>
            <button
              type="button"
              onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    priorityOptions.find((p) => p.value === issue.priority)
                      ?.dotColor || "bg-neutral-500"
                  }`}
                />
                <span className="text-xs md:text-sm text-white">
                  {priorityOptions.find((p) => p.value === issue.priority)
                    ?.label || issue.priority}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-400 transition-transform ${
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 md:px-3 md:py-2 hover:bg-neutral-700 transition-colors text-left ${
                      issue.priority === priority.value ? "bg-neutral-700" : ""
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${priority.dotColor}`}
                    />
                    <span className="text-xs md:text-sm text-white">
                      {priority.label}
                    </span>
                    {issue.priority === priority.value && (
                      <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assignee */}
          <div ref={assigneeDropdownRef} className="relative">
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

            <label className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
              <User className="w-3 h-3" />
              Assignee
            </label>
            <button
              type="button"
              onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
            >
              {issue.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar
                    src={issue.assignee.image}
                    name={issue.assignee.name}
                    size="sm"
                  />
                  <span className="text-xs md:text-sm text-white truncate">
                    {issue.assignee.name}
                  </span>
                </div>
              ) : (
                <span className="text-xs md:text-sm text-neutral-500">
                  Unassigned
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-400 transition-transform shrink-0 ${
                  isAssigneeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isAssigneeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 overflow-hidden max-h-56 md:max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleAssigneeSelect("")}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 md:px-3 md:py-2 hover:bg-neutral-700 transition-colors text-left ${
                    !issue.assignee ? "bg-neutral-700" : ""
                  }`}
                >
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-neutral-600 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-neutral-400" />
                  </div>
                  <span className="text-xs md:text-sm text-neutral-400">
                    Unassigned
                  </span>
                  {!issue.assignee && (
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400 ml-auto" />
                  )}
                </button>
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleAssigneeSelect(member.id)}
                    className={`w-full flex items-center gap-2 md:gap-3 px-2.5 py-1.5 md:px-3 md:py-2 hover:bg-neutral-700 transition-colors text-left ${
                      issue.assignee?.id === member.id ? "bg-neutral-700" : ""
                    }`}
                  >
                    <Avatar
                      src={member.image}
                      name={member.name || ""}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm text-white truncate">
                        {member.name || "Unknown"}
                      </p>
                      {member.email && (
                        <p className="text-xs text-neutral-500 truncate">
                          {member.email}
                        </p>
                      )}
                    </div>
                    {issue.assignee?.id === member.id && (
                      <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" />
              Due Date
            </label>
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
                  className="w-full px-2.5 py-1.5 md:px-3 md:py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingDueDate(false);
                      setEditDueDate(
                        issue.dueDate
                          ? new Date(issue.dueDate).toISOString().split("T")[0]
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
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors text-left ${
                  isOverdue ? "text-red-400" : ""
                }`}
              >
                <span
                  className={`text-xs md:text-sm ${
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
          <div className="pt-3 border-t border-neutral-700/50">
            <label className="text-xs text-neutral-500 flex items-center gap-1 mb-1.5">
              <Clock className="w-3 h-3" />
              Created by
            </label>
            <div className="flex items-center gap-2">
              <Avatar
                src={issue.creator.image}
                name={issue.creator.name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-white truncate">
                  {issue.creator.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date(issue.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

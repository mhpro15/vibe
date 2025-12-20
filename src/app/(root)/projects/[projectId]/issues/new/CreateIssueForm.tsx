"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { createIssueAction, IssueActionResult } from "@/lib/actions/issue";
import { suggestLabelsSimple, detectDuplicatesSimple } from "@/lib/actions/ai";
import { ChevronDown, User, AlertCircle, Sparkles, Search, X } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface DuplicateIssue {
  id: string;
  title: string;
  similarity: number;
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
  labels,
  teamMembers,
}: CreateIssueFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [suggestedLabels, setSuggestedLabels] = useState<string[]>([]);
  const [isSuggestingLabels, setIsSuggestingLabels] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateIssue[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [state, formAction, isPending] = useActionState(
    createIssueAction,
    initialState
  );

  // Close assignee dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedMember = teamMembers.find(m => m.id === selectedAssignee);

  // Debounced duplicate check when title changes
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (title.length >= 10) {
        debounceTimer.current = setTimeout(async () => {
          setIsCheckingDuplicates(true);
          try {
            const result = await detectDuplicatesSimple(projectId, title);
            if (result.success && result.duplicates) {
              setDuplicates(result.duplicates);
              setShowDuplicateWarning(result.duplicates.length > 0);
            }
          } catch {
            // Silently fail duplicate check
          } finally {
            setIsCheckingDuplicates(false);
          }
        }, 500);
      } else {
        setDuplicates([]);
        setShowDuplicateWarning(false);
      }
    },
    [projectId]
  );

  // Suggest labels based on title and description
  const handleSuggestLabels = async () => {
    const form = formRef.current;
    if (!form) return;

    const title =
      (form.elements.namedItem("title") as HTMLInputElement)?.value || "";
    const description =
      (form.elements.namedItem("description") as HTMLTextAreaElement)?.value ||
      "";

    if (!title && !description) return;

    setIsSuggestingLabels(true);
    try {
      const result = await suggestLabelsSimple(projectId, title, description);
      if (result.success && result.labels) {
        // Extract just the label names for suggestions
        setSuggestedLabels(result.labels.map((l) => l.name));
      }
    } catch {
      // Silently fail label suggestion
    } finally {
      setIsSuggestingLabels(false);
    }
  };

  // Apply suggested label
  const applySuggestedLabel = (labelName: string) => {
    const label = labels.find(
      (l) => l.name.toLowerCase() === labelName.toLowerCase()
    );
    if (label && !selectedLabels.includes(label.id)) {
      setSelectedLabels([...selectedLabels, label.id]);
      setSuggestedLabels(
        suggestedLabels.filter(
          (l) => l.toLowerCase() !== labelName.toLowerCase()
        )
      );
    }
  };

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
      <input type="hidden" name="labelIds" value={selectedLabels.join(",")} />

      {/* Main form */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 space-y-8">
        {/* Title */}
        <div>
          <Input
            label="Title"
            id="title"
            name="title"
            placeholder="What needs to be done?"
            maxLength={200}
            required
            className="text-lg"
            onChange={handleTitleChange}
            helperText={isCheckingDuplicates ? "Checking for duplicates..." : "Max 200 characters"}
          />

          {/* Duplicate Warning */}
          {showDuplicateWarning && duplicates.length > 0 && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Potential duplicates found
                </span>
              </div>
              <div className="space-y-2">
                {duplicates.slice(0, 3).map((dup) => (
                  <Link
                    key={dup.id}
                    href={`/projects/${projectId}/issues/${dup.id}`}
                    className="block p-3 bg-neutral-950/50 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all group"
                    target="_blank"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white group-hover:text-violet-400 transition-colors truncate">
                        {dup.title}
                      </span>
                      <span className="text-xs text-neutral-500 ml-2 shrink-0">
                        {Math.round(dup.similarity * 100)}% match
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateWarning(false)}
                className="mt-3 text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Dismiss warning
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-neutral-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            maxLength={5000}
            placeholder="Add more details about this issue..."
            className="w-full px-4 py-3 border border-neutral-800 rounded-xl bg-neutral-950 text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all hover:border-neutral-700"
          />
          <p className="mt-2 text-xs text-neutral-500">
            Max 5000 characters
          </p>
        </div>

        {/* Priority & Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className="w-full px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all hover:border-neutral-700 appearance-none cursor-pointer"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div ref={assigneeDropdownRef} className="relative">
            <label
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Assignee
            </label>
            <input type="hidden" name="assigneeId" value={selectedAssignee} />
            <button
              type="button"
              onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              className="w-full px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all flex items-center justify-between hover:border-neutral-700"
            >
              {selectedMember ? (
                <div className="flex items-center gap-3">
                  <Avatar src={selectedMember.image} name={selectedMember.name} size="xs" />
                  <div className="text-left">
                    <p className="text-sm text-white">{selectedMember.name}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-neutral-500">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Unassigned</span>
                </div>
              )}
              <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isAssigneeDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isAssigneeDropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                {/* Unassigned option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssignee("");
                    setIsAssigneeDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-800 transition-colors ${
                    selectedAssignee === "" ? "bg-neutral-800" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white">Unassigned</p>
                  </div>
                </button>

                <div className="border-t border-neutral-800" />

                {/* Team members */}
                <div className="max-h-60 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedAssignee(member.id);
                        setIsAssigneeDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-800 transition-colors ${
                        selectedAssignee === member.id ? "bg-neutral-800" : ""
                      }`}
                    >
                      <Avatar src={member.image} name={member.name} size="sm" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{member.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                      </div>
                      {selectedAssignee === member.id && (
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-neutral-300 mb-2"
          >
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            className="w-full md:w-auto px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all hover:border-neutral-700"
          />
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-300">
                Labels
              </label>
              <button
                type="button"
                onClick={handleSuggestLabels}
                disabled={isSuggestingLabels}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1.5 disabled:opacity-50 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10"
              >
                {isSuggestingLabels ? (
                  <>
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    AI Suggest Labels
                  </>
                )}
              </button>
            </div>

            {/* AI Suggested Labels */}
            {suggestedLabels.length > 0 && (
              <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                <p className="text-xs font-medium text-violet-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  AI Suggested Labels
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedLabels.map((labelName) => (
                    <button
                      key={labelName}
                      type="button"
                      onClick={() => applySuggestedLabel(labelName)}
                      className="px-3 py-1.5 text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full hover:bg-violet-500/20 transition-all flex items-center gap-1.5 group"
                    >
                      <span className="text-violet-500 group-hover:text-violet-400">+</span>
                      {labelName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`transition-all duration-200 ${
                    selectedLabels.includes(label.id)
                      ? "ring-2 ring-white/50 ring-offset-4 ring-offset-neutral-950 scale-105"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <Badge color={label.color}>{label.name}</Badge>
                </button>
              ))}
            </div>
            {selectedLabels.length > 0 && (
              <p className="text-xs text-neutral-500">
                {selectedLabels.length} label(s) selected
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {state.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-400">
              {state.error}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Link href={`/projects/${projectId}?tab=issues`}>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isPending} className="min-w-[140px]">
          {isPending ? "Creating..." : "Create Issue"}
        </Button>
      </div>
    </form>
  );
}

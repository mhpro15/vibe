// "use client";

// import { useState, useActionState } from "react";
// import { Button } from "@/components/ui/Button";
// import {
//   addSubtaskAction,
//   toggleSubtaskAction,
//   deleteSubtaskAction,
// } from "@/lib/actions/issue";
// import {
//   Plus,
//   CheckCircle2,
//   Circle,
//   Trash2,
//   Loader2,
//   ListChecks,
// } from "lucide-react";

// interface Subtask {
//   id: string;
//   title: string;
//   isCompleted: boolean;
//   position: number;
// }

// interface SubtasksListProps {
//   issueId: string;
//   subtasks: Subtask[];
//   readOnly?: boolean;
// }

// const initialState = { success: false };

// export function SubtasksList({
//   issueId,
//   subtasks: initialSubtasks,
//   readOnly = false,
// }: SubtasksListProps) {
//   const [subtasks, setSubtasks] = useState(initialSubtasks);
//   const [newTitle, setNewTitle] = useState("");
//   const [isAdding, setIsAdding] = useState(false);

//   const [addState, addAction, isAddPending] = useActionState(
//     addSubtaskAction,
//     initialState
//   );

//   const completedCount = subtasks.filter((s) => s.isCompleted).length;
//   const totalCount = subtasks.length;
//   const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

//   const handleAdd = async (formData: FormData) => {
//     const title = formData.get("title") as string;
//     if (!title.trim()) return;

//     // Optimistic update
//     const tempId = `temp-${Date.now()}`;
//     setSubtasks((prev) => [
//       ...prev,
//       {
//         id: tempId,
//         title: title.trim(),
//         isCompleted: false,
//         position: prev.length,
//       },
//     ]);
//     setNewTitle("");
//     setIsAdding(false);

//     // Server action
//     const result = await addAction(formData);
//     if (!result.success) {
//       // Rollback on error
//       setSubtasks((prev) => prev.filter((s) => s.id !== tempId));
//     }
//   };

//   const handleToggle = async (subtaskId: string, currentState: boolean) => {
//     // Optimistic update
//     setSubtasks((prev) =>
//       prev.map((s) =>
//         s.id === subtaskId ? { ...s, isCompleted: !currentState } : s
//       )
//     );

//     const formData = new FormData();
//     formData.set("subtaskId", subtaskId);

//     const result = await toggleSubtaskAction(initialState, formData);
//     if (!result.success) {
//       // Rollback on error
//       setSubtasks((prev) =>
//         prev.map((s) =>
//           s.id === subtaskId ? { ...s, isCompleted: currentState } : s
//         )
//       );
//     }
//   };

//   const handleDelete = async (subtaskId: string) => {
//     // Optimistic update
//     const deletedSubtask = subtasks.find((s) => s.id === subtaskId);
//     setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));

//     const formData = new FormData();
//     formData.set("subtaskId", subtaskId);

//     const result = await deleteSubtaskAction(initialState, formData);
//     if (!result.success && deletedSubtask) {
//       // Rollback on error
//       setSubtasks((prev) => [...prev, deletedSubtask]);
//     }
//   };

//   return (
//     <div className="space-y-3">
//       {/* Header with progress */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <ListChecks className="w-4 h-4 text-neutral-500" />
//           <span className="text-sm font-medium text-neutral-300">Subtasks</span>
//           {totalCount > 0 && (
//             <span className="text-xs text-neutral-500">
//               {completedCount}/{totalCount}
//             </span>
//           )}
//         </div>
//         {!readOnly && totalCount < 20 && (
//           <Button
//             type="button"
//             size="sm"
//             variant="ghost"
//             onClick={() => setIsAdding(true)}
//             className="text-xs"
//           >
//             <Plus className="w-3 h-3 mr-1" />
//             Add
//           </Button>
//         )}
//       </div>

//       {/* Progress bar */}
//       {totalCount > 0 && (
//         <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
//           <div
//             className="h-full bg-emerald-500 transition-all duration-300"
//             style={{ width: `${progress}%` }}
//           />
//         </div>
//       )}

//       {/* Subtasks list */}
//       <div className="space-y-1">
//         {subtasks.map((subtask) => (
//           <div
//             key={subtask.id}
//             className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-800/50 group"
//           >
//             <button
//               type="button"
//               onClick={() => handleToggle(subtask.id, subtask.isCompleted)}
//               disabled={readOnly}
//               className="flex-shrink-0 focus:outline-none disabled:cursor-not-allowed"
//             >
//               {subtask.isCompleted ? (
//                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
//               ) : (
//                 <Circle className="w-5 h-5 text-neutral-500 hover:text-neutral-400" />
//               )}
//             </button>
//             <span
//               className={`flex-1 text-sm ${
//                 subtask.isCompleted
//                   ? "text-neutral-500 line-through"
//                   : "text-neutral-300"
//               }`}
//             >
//               {subtask.title}
//             </span>
//             {!readOnly && (
//               <button
//                 type="button"
//                 onClick={() => handleDelete(subtask.id)}
//                 className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition-opacity"
//               >
//                 <Trash2 className="w-4 h-4" />
//               </button>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Add subtask form */}
//       {isAdding && !readOnly && (
//         <form action={handleAdd} className="flex items-center gap-2">
//           <input type="hidden" name="issueId" value={issueId} />
//           <input
//             type="text"
//             name="title"
//             value={newTitle}
//             onChange={(e) => setNewTitle(e.target.value)}
//             placeholder="Subtask title..."
//             maxLength={200}
//             autoFocus
//             className="flex-1 px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
//             onKeyDown={(e) => {
//               if (e.key === "Escape") {
//                 setIsAdding(false);
//                 setNewTitle("");
//               }
//             }}
//           />
//           <Button
//             type="submit"
//             size="sm"
//             disabled={isAddPending || !newTitle.trim()}
//           >
//             {isAddPending ? (
//               <Loader2 className="w-4 h-4 animate-spin" />
//             ) : (
//               "Add"
//             )}
//           </Button>
//           <Button
//             type="button"
//             size="sm"
//             variant="ghost"
//             onClick={() => {
//               setIsAdding(false);
//               setNewTitle("");
//             }}
//           >
//             Cancel
//           </Button>
//         </form>
//       )}

//       {/* Empty state */}
//       {totalCount === 0 && !isAdding && (
//         <p className="text-xs text-neutral-500 text-center py-2">
//           No subtasks yet
//         </p>
//       )}

//       {/* Error display */}
//       {addState.error && (
//         <p className="text-xs text-red-400">{addState.error}</p>
//       )}

//       {/* Limit warning */}
//       {totalCount >= 20 && (
//         <p className="text-xs text-amber-500">Maximum 20 subtasks reached</p>
//       )}
//     </div>
//   );
// }

// /**
//  * Compact subtask progress indicator for issue cards
//  */
// export function SubtaskProgress({
//   completed,
//   total,
// }: {
//   completed: number;
//   total: number;
// }) {
//   if (total === 0) return null;

//   return (
//     <div className="flex items-center gap-1.5 text-xs text-neutral-500">
//       <ListChecks className="w-3.5 h-3.5" />
//       <span>
//         {completed}/{total}
//       </span>
//     </div>
//   );
// }

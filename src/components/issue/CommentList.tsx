"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  updateCommentAction,
  deleteCommentAction,
  IssueActionResult,
} from "@/lib/actions/issue";

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

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
}

const initialState: IssueActionResult = {
  success: false,
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function CommentItem({
  comment,
  currentUserId,
}: {
  comment: Comment;
  currentUserId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const [updateState, updateAction, isUpdating] = useActionState(
    updateCommentAction,
    initialState
  );
  const [, deleteAction, isDeleting] = useActionState(
    deleteCommentAction,
    initialState
  );

  const isOwner = comment.author.id === currentUserId;
  const wasEdited =
    new Date(comment.updatedAt).getTime() >
    new Date(comment.createdAt).getTime() + 1000;

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  return (
    <div className="flex gap-3">
      <Avatar src={comment.author.image} name={comment.author.name} size="sm" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">
            {comment.author.name}
          </span>
          <span className="text-xs text-neutral-500">
            {formatTimeAgo(comment.createdAt)}
            {wasEdited && " (edited)"}
          </span>
        </div>

        {isEditing ? (
          <form action={updateAction} className="mt-2">
            <input type="hidden" name="commentId" value={comment.id} />
            <textarea
              name="content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-700/50 rounded-xl bg-neutral-900 text-white focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all"
              rows={3}
            />
            {updateState.error && (
              <p className="text-sm text-red-400 mt-1">{updateState.error}</p>
            )}
            <div className="flex gap-2 mt-2">
              <Button type="submit" size="sm" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-1 text-neutral-300 whitespace-pre-wrap">
              {comment.content}
            </p>
            {isOwner && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-neutral-500 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <form action={deleteAction}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function CommentList({ comments, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

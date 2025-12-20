"use client";

import { CommentList } from "@/components/issue";
import { Button } from "@/components/ui/Button";

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

interface IssueCommentsSectionProps {
  issueId: string;
  comments: Comment[];
  currentUserId: string;
  isAddingComment: boolean;
  commentAction: (formData: FormData) => void;
  commentState: { success: boolean; error?: string };
}

export function IssueCommentsSection({
  issueId,
  comments,
  currentUserId,
  isAddingComment,
  commentAction,
  commentState,
}: IssueCommentsSectionProps) {
  const formKey = `comment-form-${comments.length}`;

  return (
    <div className="bg-neutral-900 rounded-lg md:rounded-xl border border-neutral-700/50 p-3 md:p-4 lg:p-5">
      <h3 className="text-base md:text-lg font-semibold text-white mb-3">
        Comments ({comments.length})
      </h3>

      <CommentList comments={comments} currentUserId={currentUserId} />

      <form
        key={formKey}
        action={commentAction}
        className="mt-4 pt-4 border-t border-neutral-700/50"
      >
        <input type="hidden" name="issueId" value={issueId} />
        <textarea
          name="content"
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-3 py-2 border border-neutral-700/50 rounded-lg bg-neutral-900 text-sm text-white placeholder-neutral-500 focus:ring-2 focus:ring-white/10 focus:border-neutral-600 resize-none transition-all"
        />
        {commentState.error && (
          <p className="text-xs text-red-600 mt-1">{commentState.error}</p>
        )}
        <div className="flex justify-end mt-2">
          <Button type="submit" size="sm" disabled={isAddingComment}>
            {isAddingComment ? "Adding..." : "Add Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}

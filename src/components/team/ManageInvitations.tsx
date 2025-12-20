"use client";

import { useState, useOptimistic, useTransition } from "react";
import { X, Mail, Clock, UserPlus } from "lucide-react";
import { cancelInviteAction } from "@/lib/actions/team";

interface Invite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface ManageInvitationsProps {
  invitations: Invite[];
  teamId: string;
  onInviteCancelled?: () => void;
}

export function ManageInvitations({
  invitations,
  onInviteCancelled,
}: ManageInvitationsProps) {
  const [optimisticInvitations, removeOptimisticInvitation] = useOptimistic(
    invitations,
    (state, inviteId: string) => state.filter((inv) => inv.id !== inviteId)
  );
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (optimisticInvitations.length === 0) {
    return null;
  }

  async function handleCancel(inviteId: string) {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    setProcessingId(inviteId);

    startTransition(async () => {
      removeOptimisticInvitation(inviteId);

      try {
        const formData = new FormData();
        formData.set("inviteId", inviteId);

        const result = await cancelInviteAction({ success: false }, formData);

        if (result.success) {
          onInviteCancelled?.();
        } else {
          alert(result.error || "Failed to cancel invitation");
        }
      } catch {
        alert("Failed to cancel invitation");
      } finally {
        setProcessingId(null);
      }
    });
  }

  function formatTimeLeft(expiresAt: Date) {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else if (diffHours > 0) {
      return `${diffHours}h left`;
    } else {
      return "Expiring soon";
    }
  }

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Pending Invitations
            </h3>
            <p className="text-xs text-neutral-500">
              {optimisticInvitations.length} pending
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-neutral-800">
        {optimisticInvitations.map((invite) => (
          <div
            key={invite.id}
            className="px-5 py-4 flex items-center justify-between hover:bg-neutral-800/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
                <Mail className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {invite.email}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-neutral-500">
                    Role: <span className="text-amber-400">{invite.role}</span>
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeLeft(invite.expiresAt)}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Invited by {invite.sender.name || invite.sender.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCancel(invite.id)}
              disabled={processingId === invite.id}
              className="ml-3 p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Cancel invitation"
            >
              {processingId === invite.id ? (
                <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { respondToInviteAction } from "@/lib/actions/team";
import { Users, Check, X, Clock, UserPlus } from "lucide-react";

interface Invite {
  id: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  team: {
    id: string;
    name: string;
  };
  sender: {
    name: string | null;
    email: string;
  } | null;
}

interface PendingInvitationsProps {
  invitations: Invite[];
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [optimisticInvitations, removeOptimisticInvitation] = useOptimistic(
    invitations,
    (state, inviteId: string) => state.filter((inv) => inv.id !== inviteId)
  );

  if (optimisticInvitations.length === 0) {
    return null;
  }

  function handleRespond(inviteId: string, response: "accept" | "decline") {
    setProcessingId(inviteId);
    removeOptimisticInvitation(inviteId);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("inviteId", inviteId);
      formData.set("response", response);

      const result = await respondToInviteAction({ success: false }, formData);

      if (!result.success) {
        alert(result.error || "Failed to process invitation");
      }

      setProcessingId(null);
      router.refresh();
    });
  }

  function formatTimeRemaining(expiresAt: Date) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
    return "Expires soon";
  }

  return (
    <section className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">
            Pending Invitations
          </h2>
          <p className="text-xs text-neutral-400">
            You have {optimisticInvitations.length} team invitation
            {optimisticInvitations.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {optimisticInvitations.map((invite) => (
          <div
            key={invite.id}
            className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {invite.team.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Invited by{" "}
                    {invite.sender?.name || invite.sender?.email || "Unknown"}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                      Role: {invite.role === "ADMIN" ? "Admin" : "Member"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeRemaining(invite.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => handleRespond(invite.id, "decline")}
                  disabled={isPending}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Decline invitation"
                >
                  {processingId === invite.id ? (
                    <span className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleRespond(invite.id, "accept")}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {processingId === invite.id ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Accept
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

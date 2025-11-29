"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { inviteMemberAction } from "@/lib/actions/team";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}: InviteMemberModalProps) {
  const [state, formAction, isPending] = useActionState(inviteMemberAction, {
    success: false,
  });

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      onClose();
    }
  }, [state.success, onSuccess, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      size="md"
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="teamId" value={teamId} />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="colleague@example.com"
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Role
          </label>
          <select
            name="role"
            defaultValue="MEMBER"
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MEMBER">
              Member - Can view and work on projects
            </option>
            <option value="ADMIN">
              Admin - Can manage projects and members
            </option>
          </select>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          An invitation will be sent to this email address. The invitation
          expires in 7 days.
        </p>

        {state.error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
            Invitation sent successfully!
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}

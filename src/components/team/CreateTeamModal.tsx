"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createTeamAction } from "@/lib/actions/team";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTeamModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTeamModalProps) {
  const [state, formAction, isPending] = useActionState(createTeamAction, {
    success: false,
  });

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      onClose();
    }
  }, [state.success, onSuccess, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Team" size="md">
      <form action={formAction} className="space-y-4">
        <Input
          label="Team Name"
          name="name"
          placeholder="Enter team name"
          required
          minLength={1}
          maxLength={50}
        />

        {state.error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
}

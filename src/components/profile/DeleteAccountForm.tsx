"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deleteAccountAction } from "@/lib/actions/auth";
import { AlertTriangle } from "lucide-react";

const initialState = { success: false, error: undefined, redirectTo: undefined };

export function DeleteAccountForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    initialState
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  const handleClose = () => {
    setIsOpen(false);
    setConfirmText("");
  };

  if (!isOpen) {
    return (
      <section className="bg-neutral-900/50 border border-red-900/30 rounded-xl p-5">
        <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-4">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white text-sm">Delete Account</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Permanently delete your account and all associated data
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-red-950/30 border border-red-900/50 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-red-400">
            Delete Your Account
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            This action is irreversible. All your data will be permanently deleted.
          </p>
        </div>
      </div>

      <div className="bg-neutral-900/50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-white mb-2">
          This will permanently delete:
        </h3>
        <ul className="text-sm text-neutral-400 space-y-1">
          <li>• Your profile and account settings</li>
          <li>• Your team memberships (you&apos;ll be removed from all teams)</li>
          <li>• Your comments and activity history</li>
          <li>• Issues assigned to you will be unassigned</li>
        </ul>
      </div>

      <form action={formAction}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Type <span className="text-red-400 font-bold">DELETE</span> to confirm
          </label>
          <Input
            name="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="bg-neutral-900 border-red-900/50 focus:border-red-500"
          />
        </div>

        {state.error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
            <p className="text-sm text-red-400">{state.error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={confirmText !== "DELETE" || isPending}
            isLoading={isPending}
          >
            {isPending ? "Deleting..." : "Delete My Account"}
          </Button>
        </div>
      </form>
    </section>
  );
}

"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type AuthActionResult,
} from "@/lib/actions/auth";
import { Button, Input } from "@/components/ui";

const initialState: AuthActionResult = {
  success: false,
};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  );

  return (
    <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-5">
      <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
        Change Password
      </h2>

      {state.error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
          <p className="text-sm text-red-400">
            {state.error}
          </p>
        </div>
      )}

      {state.success && (
        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-900/50 rounded-lg">
          <p className="text-sm text-emerald-400">
            Password changed successfully!
          </p>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <Input
          label="Current Password"
          name="currentPassword"
          type="password"
          placeholder="••••••••"
          disabled={isPending}
          required
        />

        <Input
          label="New Password"
          name="newPassword"
          type="password"
          placeholder="••••••••"
          helperText="Must be at least 6 characters"
          disabled={isPending}
          required
          minLength={6}
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          disabled={isPending}
          required
          minLength={6}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isPending}>
            Change Password
          </Button>
        </div>
      </form>
    </section>
  );
}

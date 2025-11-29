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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Change Password
      </h2>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        </div>
      )}

      {state.success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
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

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={isPending}>
            Change Password
          </Button>
        </div>
      </form>
    </div>
  );
}

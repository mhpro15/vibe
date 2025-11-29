"use client";

import { useActionState, useEffect, useState } from "react";
import {
  changePasswordAction,
  checkUserHasPasswordAction,
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
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPassword = async () => {
      const result = await checkUserHasPasswordAction();
      setHasPassword(result.hasPassword);
      setIsChecking(false);
    };
    checkPassword();
  }, []);

  if (isChecking) {
    return (
      <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
          Change Password
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-neutral-800 rounded"></div>
          <div className="h-10 bg-neutral-800 rounded"></div>
        </div>
      </section>
    );
  }

  // OAuth user without password
  if (!hasPassword) {
    return (
      <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
          Password
        </h2>
        <div className="flex items-start gap-3 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-white font-medium">Signed in with Google</p>
            <p className="text-xs text-neutral-400 mt-1">
              You signed up using Google, so you don&apos;t have a password to change. 
              Your account is secured through Google&apos;s authentication.
            </p>
          </div>
        </div>
      </section>
    );
  }

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
          helperText="Must be at least 8 characters"
          disabled={isPending}
          required
          minLength={8}
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          disabled={isPending}
          required
          minLength={8}
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

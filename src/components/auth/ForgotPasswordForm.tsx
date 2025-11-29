"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  forgotPasswordAction,
  type AuthActionResult,
} from "@/lib/actions/auth";
import { Button, Input } from "@/components/ui";

const initialState: AuthActionResult = {
  success: false,
};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState
  );

  if (state.success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Check your email
          </h1>
          <p className="text-neutral-400 mb-6 text-sm">
            If an account exists with that email, we&apos;ve sent a password
            reset link. The link will expire in 1 hour.
          </p>
          <Link href="/signin">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Forgot password?
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">
              {state.error}
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            disabled={isPending}
            required
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Send Reset Link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Remember your password?{" "}
          <Link
            href="/signin"
            className="font-medium text-white hover:text-neutral-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

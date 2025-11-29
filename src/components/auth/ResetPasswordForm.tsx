"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { resetPasswordAction, type AuthActionResult } from "@/lib/actions/auth";
import { Button, Input } from "@/components/ui";

const initialState: AuthActionResult = {
  success: false,
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [state, formAction, isPending] = useActionState(
    async (_prevState: AuthActionResult, formData: FormData) => {
      if (!token) {
        return {
          success: false,
          error: "Invalid reset link. Please request a new password reset.",
        };
      }
      formData.set("token", token);
      return resetPasswordAction(_prevState, formData);
    },
    initialState
  );

  // Error from URL
  const displayError =
    urlError === "INVALID_TOKEN"
      ? "This password reset link is invalid or has expired. Please request a new one."
      : state.error;

  useEffect(() => {
    if (state.success) {
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    }
  }, [state.success, router]);

  if (!token && !urlError) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Invalid Link
          </h1>
          <p className="text-neutral-400 mb-6 text-sm">
            This password reset link is invalid. Please request a new one.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Password Reset!
          </h1>
          <p className="text-neutral-400 mb-6 text-sm">
            Your password has been successfully reset. Redirecting to sign in...
          </p>
          <Link href="/signin">
            <Button variant="outline" className="w-full">
              Go to Sign In
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
            Reset your password
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Enter your new password below
          </p>
        </div>

        {displayError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">
                {displayError}
              </p>
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <Input
            label="New Password"
            name="password"
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

          <Button type="submit" className="w-full" isLoading={isPending}>
            Reset Password
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

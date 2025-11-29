"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpAction, type AuthActionResult } from "@/lib/actions/auth";
import { signIn } from "@/lib/auth-client";
import { Button, Input } from "@/components/ui";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const initialState: AuthActionResult = {
  success: false,
};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState
  );
  const [googleError, setGoogleError] = useState<string | null>(null);

  const displayError = state.error || googleError;

  // Helper to get contextual help for specific errors
  const getErrorHelp = (error: string) => {
    if (error.includes("already exists")) {
      return (
        <p className="text-xs text-red-400/70 mt-1">
          Try{" "}
          <Link href="/signin" className="underline hover:text-red-300">
            signing in
          </Link>
          {" "}instead, or{" "}
          <Link href="/forgot-password" className="underline hover:text-red-300">
            reset your password
          </Link>
        </p>
      );
    }
    if (error.includes("Password")) {
      return (
        <p className="text-xs text-red-400/70 mt-1">
          Use at least 6 characters with a mix of letters and numbers
        </p>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Create an account
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Get started with Vibe
          </p>
        </div>

        {state.success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Account created successfully!
              </p>
              <p className="text-xs text-emerald-400/70 mt-1">
                Redirecting you to the dashboard...
              </p>
            </div>
          </div>
        )}

        {displayError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">
                {displayError}
              </p>
              {getErrorHelp(displayError)}
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <Input
            label="Full Name"
            name="name"
            type="text"
            placeholder="John Doe"
            disabled={isPending}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            disabled={isPending}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            helperText="Must be at least 6 characters"
            disabled={isPending}
            required
            minLength={6}
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            disabled={isPending}
            required
            minLength={6}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Create Account
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-neutral-900/50 text-neutral-500">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleSignInButton 
            className="mt-4" 
            onError={(error) => setGoogleError(error)}
          />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
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

function GoogleSignInButton({ 
  className = "",
  onError 
}: { 
  className?: string;
  onError?: (error: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      onError?.("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full ${className}`}
      onClick={handleGoogleSignIn}
      isLoading={isLoading}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}

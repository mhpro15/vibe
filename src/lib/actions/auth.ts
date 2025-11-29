"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthActionResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

// FR-001: Sign Up with email/password
export async function signUpAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation
  if (!name || name.length < 1 || name.length > 50) {
    return { success: false, error: "Name must be between 1 and 50 characters" };
  }

  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  if (!password || password.length < 6 || password.length > 100) {
    return { success: false, error: "Password must be between 6 and 100 characters" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  try {
    const response = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      headers: await headers(),
    });

    if (!response) {
      return { success: false, error: "Failed to create account" };
    }

    redirect("/dashboard");
  } catch (error: unknown) {
    // Check if it's a redirect (not an actual error)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Sign up error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create account";
    if (errorMessage.includes("email") || errorMessage.includes("exists")) {
      return { success: false, error: "An account with this email already exists" };
    }
    return { success: false, error: errorMessage };
  }
}

// FR-002: Sign In with email/password
export async function signInAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });

    if (!response) {
      return { success: false, error: "Email or password is incorrect" };
    }

    redirect("/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Sign in error:", error);
    return { success: false, error: "Email or password is incorrect" };
  }
}

// FR-003: Request password reset
export async function forgotPasswordAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  try {
    // Use the internal API endpoint for password reset request
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/forget-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        redirectTo: `${baseUrl}/reset-password`,
      }),
    });

    // Always return success to prevent email enumeration
    if (!response.ok) {
      console.error("Forgot password API error:", await response.text());
    }
    return { success: true };
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return success to prevent email enumeration
    return { success: true };
  }
}

// FR-003: Reset password with token
export async function resetPasswordAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { success: false, error: "Invalid or expired reset link" };
  }

  if (!password || password.length < 6 || password.length > 100) {
    return { success: false, error: "Password must be between 6 and 100 characters" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  try {
    await auth.api.resetPassword({
      body: {
        token,
        newPassword: password,
      },
      headers: await headers(),
    });

    return { success: true, redirectTo: "/signin" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Invalid or expired reset link. Please request a new one." };
  }
}

// FR-002: Sign Out
export async function signOutAction(): Promise<void> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Sign out error:", error);
  }
  redirect("/signin");
}

// FR-006: Change password
export async function changePasswordAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword) {
    return { success: false, error: "Current password is required" };
  }

  if (!newPassword || newPassword.length < 6 || newPassword.length > 100) {
    return { success: false, error: "New password must be between 6 and 100 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "Current password is incorrect" };
  }
}

// FR-005: Update profile
export async function updateProfileAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const name = formData.get("name") as string;
  const image = formData.get("image") as string;

  if (!name || name.length < 1 || name.length > 50) {
    return { success: false, error: "Name must be between 1 and 50 characters" };
  }

  try {
    await auth.api.updateUser({
      body: {
        name,
        image: image || undefined,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// Get current session (for server components)
export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    return null;
  }
}

// Check if user is authenticated (for middleware/guards)
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }
  return session;
}

"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { updateProfileAction, type AuthActionResult } from "@/lib/actions/auth";
import { Button, Input } from "@/components/ui";

const initialState: AuthActionResult = {
  success: false,
};

export function ProfileForm() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [imageUrl, setImageUrl] = useState("");
  const [state, formAction, isSubmitting] = useActionState(updateProfileAction, initialState);

  // Get initial image URL from session (memoized)
  const initialImageUrl = useMemo(() => session?.user?.image || "", [session?.user?.image]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (isPending) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">Profile updated successfully!</p>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
            {(imageUrl || initialImageUrl) ? (
              <Image 
                src={imageUrl || initialImageUrl} 
                alt="Profile" 
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-semibold text-gray-500">
                {session?.user?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <Input
              label="Profile Image URL"
              name="image"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              defaultValue={session?.user?.image || ""}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <Input
          label="Full Name"
          name="name"
          type="text"
          placeholder="John Doe"
          defaultValue={session?.user?.name || ""}
          helperText="1-50 characters"
          disabled={isSubmitting}
          required
        />

        <div className="pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
          <p className="text-gray-900 dark:text-white">{session?.user?.email}</p>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

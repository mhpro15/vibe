"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Button, Input } from "@/components/ui";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ProfileForm() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (!name || name.length < 1 || name.length > 50) {
      setError("Name must be between 1 and 50 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the client API to update user
      const { error: updateError } = await authClient.updateUser({
        name,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update profile");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      // Refresh the page to get updated session data
      router.refresh();
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="animate-pulse space-y-4 bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-5">
        <div className="h-4 bg-neutral-800 rounded w-32"></div>
        <div className="h-10 bg-neutral-800 rounded"></div>
        <div className="h-10 bg-neutral-800 rounded w-24 ml-auto"></div>
      </div>
    );
  }

  return (
    <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-5">
      <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
        Personal Information
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-900/50 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">
            Profile updated successfully!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center overflow-hidden">
            <span className="text-xl font-medium text-neutral-400">
              {session?.user?.name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="text-xs text-neutral-500">{session?.user?.email}</p>
          </div>
        </div>

        <Input
          label="Full Name"
          name="name"
          type="text"
          placeholder="John Doe"
          defaultValue={session?.user?.name || ""}
          disabled={isSubmitting}
          required
        />

        <div>
          <p className="text-xs text-neutral-500 mb-1.5">Email</p>
          <p className="text-sm text-neutral-300 bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2.5">
            {session?.user?.email}
          </p>
          <p className="text-xs text-neutral-600 mt-1">Email cannot be changed</p>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </section>
  );
}

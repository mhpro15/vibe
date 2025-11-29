import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { ProfileForm, ChangePasswordForm } from "@/components/profile";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-medium text-white">
          Profile Settings
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <ProfileForm />
        <ChangePasswordForm />

        {/* Danger Zone */}
        <section className="bg-neutral-900/50 border border-red-900/30 rounded-xl p-5">
          <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-4">
            Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white text-sm">
                Delete Account
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/20 transition-colors">
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

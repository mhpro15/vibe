import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { ProfileForm, ChangePasswordForm, DeleteAccountForm } from "@/components/profile";

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
        <DeleteAccountForm />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { inviteMemberAction } from "@/lib/actions/team";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}: InviteMemberModalProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.set("teamId", teamId);

    try {
      const result = await inviteMemberAction({ success: false }, formData);
      
      if (result.error) {
        setError(result.error);
        setIsPending(false);
        return;
      }

      if (result.success) {
        setSuccess(true);
        router.refresh();
        
        // Close modal after short delay to show success message
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(false);
          setError(null);
        }, 1500);
      }
    } catch (err) {
      console.error("Invite member error:", err);
      setError("Failed to send invitation. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="colleague@example.com"
          disabled={isPending || success}
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-300">
            Role
          </label>
          <select
            name="role"
            defaultValue="MEMBER"
            disabled={isPending || success}
            className="w-full px-4 py-2.5 border rounded-xl bg-neutral-950 text-white border-neutral-800 hover:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-neutral-600 transition-all disabled:opacity-50"
          >
            <option value="MEMBER">
              Member - Can view and work on projects
            </option>
            <option value="ADMIN">
              Admin - Can manage projects and members
            </option>
          </select>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <Mail className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-400">
            An invitation will be sent to this email address. The invitation
            expires in 7 days.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-900/50 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-sm text-emerald-400">
              Invitation sent successfully!
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending} disabled={success}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}

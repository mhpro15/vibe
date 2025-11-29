import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserTeams, getMyInvites } from "@/lib/actions/team";
import { TeamsClient } from "./TeamsClient";

export const metadata = {
  title: "Teams | Vibe",
};

export default async function TeamsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const [teams, invitations] = await Promise.all([
    getUserTeams(),
    getMyInvites(),
  ]);

  return <TeamsClient initialTeams={teams} initialInvitations={invitations} />;
}
